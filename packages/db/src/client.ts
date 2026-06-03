import path from "node:path";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Local-first database with a production swap built in.
 *
 * Dev (no `DATABASE_URL`): an embedded PGlite Postgres persisted to a folder at
 * the repo root (`.localdb/`). No Docker, no accounts, fully offline.
 *
 * Prod (`DATABASE_URL` set): a managed Postgres (Supabase/Neon) over
 * `postgres-js`. Same Postgres dialect, so the schema and every query stay
 * identical — only the driver changes. On Vercel the embedded PGlite can't be
 * used: the serverless filesystem is ephemeral and not shared between
 * invocations, so `DATABASE_URL` is required there.
 *
 * The connection is created lazily on first query (not at import) so that
 * `next build` can trace/collect modules without opening a connection.
 */

// Both drizzle drivers share the same query API (drizzle-orm core); the PGlite
// instance type is used as the canonical shape and the postgres-js instance is
// cast to it.
type DB = ReturnType<typeof drizzlePglite<typeof schema>>;

// Cache across Next.js hot reloads / warm serverless invocations to avoid
// opening multiple connections (PGlite is single-handle; Postgres pools).
const globalForDb = globalThis as unknown as {
  __pglite?: PGlite;
  __sql?: ReturnType<typeof postgres>;
  __db?: DB;
};

function getDb(): DB {
  if (globalForDb.__db) return globalForDb.__db;

  const url = process.env.DATABASE_URL;
  if (url) {
    // Managed Postgres. `prepare: false` keeps us compatible with
    // transaction-mode connection poolers (Supabase :6543, Neon pooler), which
    // don't support prepared statements. A small pool is plenty per serverless
    // instance — the pooler does the real fan-out.
    const sql =
      globalForDb.__sql ??
      postgres(url, {
        prepare: false,
        max: process.env.DATABASE_POOL_MAX
          ? Number(process.env.DATABASE_POOL_MAX)
          : 5,
        idle_timeout: 20,
      });
    globalForDb.__sql = sql;
    const instance = drizzlePostgres(sql, { schema }) as unknown as DB;
    globalForDb.__db = instance;
    return instance;
  }

  // Embedded PGlite for local dev. Both apps/web and packages/db sit two levels
  // below the repo root, so the default relative path resolves to the same
  // `.localdb/` everywhere.
  const dataDir = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.LOCAL_DB_DIR ?? "../../.localdb"
  );

  const client = globalForDb.__pglite ?? new PGlite(dataDir);
  globalForDb.__pglite = client;
  const instance = drizzlePglite(client, { schema });
  globalForDb.__db = instance;
  return instance;
}

/** Lazy proxy: PGlite is constructed only when the db is first used. */
export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };

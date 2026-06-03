import path from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema";

/**
 * Applies pending Drizzle migrations.
 *
 * Local (no `DATABASE_URL`): migrates the embedded PGlite `.localdb/`.
 * Prod (`DATABASE_URL` set): migrates the managed Postgres.
 *
 * For production, point `DATABASE_URL` at a *direct* (non-pooled) connection
 * when possible — DDL through a transaction-mode pooler can be flaky. See
 * DEPLOYMENT.md.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(here, "..", "drizzle");
const url = process.env.DATABASE_URL;

if (url) {
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const postgres = (await import("postgres")).default;

  const sql = postgres(url, { max: 1, prepare: false });
  const db = drizzle(sql, { schema });
  await migrate(db, { migrationsFolder });
  await sql.end();

  // Redact credentials before logging the target.
  console.log(`✓ migrations applied to ${url.replace(/:\/\/[^@]+@/, "://****@")}`);
} else {
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const { PGlite } = await import("@electric-sql/pglite");

  const dataDir = path.resolve(
    process.cwd(),
    process.env.LOCAL_DB_DIR ?? "../../.localdb"
  );
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  await client.close();

  console.log(`✓ migrations applied to ${dataDir}`);
}

import { defineConfig } from "drizzle-kit";

// When DATABASE_URL is set (production), point drizzle-kit (studio/push) at the
// managed Postgres. Otherwise use the embedded PGlite under the repo root.
const url = process.env.DATABASE_URL;

export default defineConfig(
  url
    ? {
        dialect: "postgresql",
        schema: "./src/schema.ts",
        out: "./drizzle",
        dbCredentials: { url },
        verbose: true,
        strict: true,
      }
    : {
        dialect: "postgresql",
        driver: "pglite",
        schema: "./src/schema.ts",
        out: "./drizzle",
        dbCredentials: {
          // Relative to packages/db (drizzle-kit's CWD) -> repo-root /.localdb
          url: process.env.LOCAL_DB_DIR ?? "../../.localdb",
        },
        verbose: true,
        strict: true,
      }
);

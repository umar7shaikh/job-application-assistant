import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the monorepo root (a stray lockfile elsewhere can mislead detection).
  turbopack: {
    root: path.resolve(process.cwd(), "..", ".."),
  },
  // Resume uploads (PDFs) can exceed the 1 MB server-action default.
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  // Workspace packages ship raw TypeScript; have Next compile them.
  transpilePackages: ["@builder/db", "@builder/shared"],
  // PGlite (wasm) and react-pdf are heavy/native-ish — keep external on server.
  serverExternalPackages: ["@electric-sql/pglite", "@react-pdf/renderer"],
};

export default nextConfig;

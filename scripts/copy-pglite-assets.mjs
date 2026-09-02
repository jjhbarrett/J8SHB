#!/usr/bin/env node
/**
 * Nitro bundles `@electric-sql/pglite` into `_libs/electric-sql__pglite.mjs`
 * but does not copy `pglite.wasm` / `pglite.data` / `initdb.wasm` next to it.
 * On Vercel that makes every auth request 500 (ENOENT pglite.data).
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const destDir = join(
  root,
  ".vercel/output/functions/__server.func/_libs",
);

if (!existsSync(destDir)) {
  console.log("[pglite] no Vercel function output — skip");
  process.exit(0);
}

const pgliteDist = dirname(require.resolve("@electric-sql/pglite"));
const files = ["pglite.data", "pglite.wasm", "initdb.wasm"];

mkdirSync(destDir, { recursive: true });
for (const file of files) {
  const src = join(pgliteDist, file);
  if (!existsSync(src)) {
    console.warn(`[pglite] missing ${src}`);
    continue;
  }
  copyFileSync(src, join(destDir, file));
  console.log(`[pglite] copied ${file}`);
}

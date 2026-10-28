#!/usr/bin/env node
/**
 * run-migrations.mjs
 * Applies Supabase migrations using the Supabase Management REST API.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=<your-pat> node scripts/run-migrations.mjs
 *
 * Or, if you have a direct Postgres URL (Settings → Database → Connection string):
 *   DATABASE_URL=postgresql://... node scripts/run-migrations.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(__dirname, "../supabase/migrations");
const seedFile = resolve(__dirname, "../supabase/seed.sql");

const MIGRATION_FILES = [
  "001_schema.sql",
  "002_rls.sql",
];

// ── Option 1: Direct Postgres via pg ──────────────────────────────────────────
async function runWithPg(databaseUrl) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  for (const file of MIGRATION_FILES) {
    const sql = readFileSync(resolve(migrationsDir, file), "utf8");
    console.log(`▶ Running ${file}...`);
    await client.query(sql);
    console.log(`  ✓ ${file} applied`);
  }

  if (process.argv.includes("--seed")) {
    const sql = readFileSync(seedFile, "utf8");
    console.log("▶ Running seed.sql...");
    await client.query(sql);
    console.log("  ✓ seed.sql applied");
  }

  await client.end();
  console.log("\n✅ All migrations complete.");
}

// ── Main ──────────────────────────────────────────────────────────────────────
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(`
╔══════════════════════════════════════════════════════════════╗
║  Beacon — Migration Runner                                   ║
╠══════════════════════════════════════════════════════════════╣
║  Provide a DATABASE_URL environment variable with your       ║
║  Supabase direct Postgres connection string.                 ║
║                                                              ║
║  Find it in: Supabase Dashboard → Settings → Database        ║
║  → Connection string (URI mode)                              ║
║                                                              ║
║  Example:                                                    ║
║  DATABASE_URL=postgresql://postgres:[password]@db.[ref]...   ║
║    .supabase.co:5432/postgres                                ║
║  node scripts/run-migrations.mjs                             ║
║                                                              ║
║  Add --seed flag to also run seed.sql                        ║
╚══════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

runWithPg(databaseUrl).catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});

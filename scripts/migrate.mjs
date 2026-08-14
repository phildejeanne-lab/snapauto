// Applique les migrations SQL de supabase/migrations dans l'ordre.
// Usage : node scripts/migrate.mjs
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config as loadEnv } from "dotenv";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
// Charger .env.local en priorité (comme Next.js), puis .env en repli.
loadEnv({ path: join(here, "..", ".env.local") });
loadEnv({ path: join(here, "..", ".env") });

const migrationsDir = join(here, "..", "supabase", "migrations");

const url = process.env.SUPABASE_DB_URL;
if (!url || url.includes("__A_COMPLETER__")) {
  console.error("❌ SUPABASE_DB_URL manquant dans .env.local (Settings → Database → Connection string → URI).");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", max: 1 });

try {
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const content = await readFile(join(migrationsDir, file), "utf8");
    process.stdout.write(`▶ ${file} … `);
    await sql.unsafe(content);
    console.log("ok");
  }
  console.log("✅ Migrations appliquées.");
} catch (e) {
  console.error("\n❌ Échec migration:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}

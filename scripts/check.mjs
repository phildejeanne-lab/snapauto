// Vérifie l'état du schéma. Usage : node scripts/check.mjs
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config as loadEnv } from "dotenv";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(here, "..", ".env.local") });

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "require", max: 1 });
try {
  const tables = await sql`
    select c.relname as table, c.relrowsecurity as rls,
           (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname`;
  console.table(tables.map((t) => ({ table: t.table, RLS: t.rls, policies: Number(t.policies) })));
  const buckets = await sql`select id, public from storage.buckets order by id`;
  console.log("buckets:", buckets.map((b) => `${b.id}(public=${b.public})`).join(", "));
} finally {
  await sql.end();
}

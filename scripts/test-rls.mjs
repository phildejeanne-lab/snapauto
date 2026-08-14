import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config as loadEnv } from "dotenv";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(here, "..", ".env.local") });
const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "require", max: 1 });

try {
  const [u] = await sql`select id from auth.users order by created_at desc limit 1`;
  const uid = u.id;
  console.log("user:", uid);

  // Simuler la session RLS de cet utilisateur
  const test = async (label, query) => {
    try {
      const rows = await sql.begin(async (tx) => {
        await tx`select set_config('role','authenticated',true)`;
        await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: uid, role: "authenticated" })}, true)`;
        return await query(tx);
      });
      console.log(`✅ ${label}:`, JSON.stringify(rows));
    } catch (e) {
      console.log(`❌ ${label}:`, e.message);
    }
  };

  await test("memberships (RLS)", (tx) => tx`select org_id, role from public.memberships`);
  await test("organizations (RLS)", (tx) => tx`select id, name, siren from public.organizations`);
  await test("is_org_member helper", (tx) => tx`select public.is_org_member((select org_id from public.memberships limit 1)) as ok`);
} finally {
  await sql.end();
}

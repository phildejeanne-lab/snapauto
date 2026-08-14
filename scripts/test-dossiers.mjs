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

  const asUser = (q) =>
    sql.begin(async (tx) => {
      await tx`select set_config('role','authenticated',true)`;
      await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: uid, role: "authenticated" })}, true)`;
      return q(tx);
    });

  const [org] = await asUser((tx) => tx`select id from public.organizations limit 1`);
  console.log("org:", org.id.slice(0, 8));

  const [ins] = await asUser(
    (tx) => tx`insert into public.dossiers (org_id, operation, immat, label, status, data)
      values (${org.id}, 'vente', 'GF-065-EZ', 'Test FIAT 500', 'ready', ${sql.json({ operation: "vente", vehicle: { immat: "GF-065-EZ" } })})
      returning id`,
  );
  console.log("✅ insert dossier:", ins.id.slice(0, 8));

  const list = await asUser((tx) => tx`select id, label, operation, immat from public.dossiers order by created_at desc`);
  console.log(`✅ list (${list.length}):`, list.map((r) => `${r.operation}/${r.immat}/${r.label}`).join(" | "));

  // nettoyage du dossier de test
  await asUser((tx) => tx`delete from public.dossiers where id = ${ins.id}`);
  console.log("✅ delete (cleanup) ok");
} catch (e) {
  console.log("❌", e.message);
} finally {
  await sql.end();
}

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config as loadEnv } from "dotenv";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(here, "..", ".env.local") });
const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "require", max: 1 });
try {
  const users = await sql`select id, email, created_at from auth.users order by created_at desc limit 5`;
  console.log("auth.users:", users.length);
  console.table(users.map((u) => ({ email: u.email, id: u.id.slice(0, 8) })));
  const profiles = await sql`select user_id, email from public.profiles`;
  console.log("profiles:", profiles.length);
  const orgs = await sql`select id, name, siren, city, created_by from public.organizations`;
  console.log("organizations:", orgs.length);
  console.table(orgs.map((o) => ({ name: o.name, siren: o.siren, city: o.city, by: o.created_by?.slice(0, 8) })));
  const m = await sql`select org_id, user_id, role from public.memberships`;
  console.log("memberships:", m.length);
  console.table(m.map((x) => ({ role: x.role, org: x.org_id.slice(0, 8), user: x.user_id.slice(0, 8) })));
} finally {
  await sql.end();
}

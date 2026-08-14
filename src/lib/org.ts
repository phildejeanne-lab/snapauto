import { createClient } from "./supabase/server";

export type Org = {
  id: string;
  name: string | null;
  siren: string | null;
  agrement: string | null;
  address_line: string | null;
  postal_code: string | null;
  city: string | null;
};

// Récupère l'utilisateur connecté et son organisation (1re appartenance).
export async function getUserAndOrg() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, org: null as Org | null };

  const { data: m } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!m?.org_id) return { user, org: null as Org | null };

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, siren, agrement, address_line, postal_code, city")
    .eq("id", m.org_id)
    .maybeSingle();

  return { user, org: (org ?? null) as Org | null };
}

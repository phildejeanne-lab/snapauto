import { createClient } from "@supabase/supabase-js";

// Purge quotidienne des pièces de dossier arrivées à échéance (~2 mois après l'opération).
// Déclenchée par le Cron Vercel (voir vercel.json). Protégée par CRON_SECRET.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquant" }, { status: 500 });
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: expired, error } = await sb
    .from("dossier_documents")
    .select("id, storage_path")
    .lt("purge_after", new Date().toISOString())
    .limit(1000);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!expired || expired.length === 0) return Response.json({ purged: 0 });

  const paths = expired.map((d) => d.storage_path as string);
  const { error: rmErr } = await sb.storage.from("dossier-docs").remove(paths);
  if (rmErr) return Response.json({ error: rmErr.message }, { status: 500 });

  const ids = expired.map((d) => d.id as string);
  const { error: delErr } = await sb.from("dossier_documents").delete().in("id", ids);
  if (delErr) return Response.json({ error: delErr.message }, { status: 500 });

  return Response.json({ purged: ids.length });
}

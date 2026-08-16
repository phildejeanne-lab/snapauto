"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/AppHeader";

type Row = {
  id: string;
  label: string | null;
  operation: "achat" | "vente" | null;
  immat: string | null;
  status: string | null;
  created_at: string;
  linked_dossier_id: string | null;
  prix: string | null;
};

const fmtPrix = (p: string | null) => {
  if (!p) return null;
  const n = Number(String(p).replace(/[^\d.,]/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n === 0) return null;
  return n.toLocaleString("fr-FR") + " €";
};

export default function DossiersPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("dossiers")
        .select("id, label, operation, immat, status, created_at, linked_dossier_id, prix:data->cession->>prix")
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setRows((data ?? []) as Row[]);
    })();
  }, []);

  async function remove(id: string) {
    if (!window.confirm("Supprimer définitivement ce dossier ?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("dossiers").delete().eq("id", id);
    if (error) setError(error.message);
    else setRows((rs) => rs?.filter((r) => r.id !== id) ?? null);
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Dossiers</h1>
          <p className="text-sm text-slate-400">Vos dossiers de cession enregistrés.</p>
        </div>
        <Link href="/app" className="btn-cyan">
          + Nouveau
        </Link>
      </div>

      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      {!rows && !error && (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => <li key={i} className="skeleton h-16 w-full" />)}
        </ul>
      )}
      {rows && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
          Aucun dossier enregistré pour l'instant.
          <br />
          <Link href="/app" className="mt-2 inline-block font-medium text-accent hover:underline">Créer un premier dossier</Link>
        </div>
      )}

      <ul className="flex flex-col gap-2.5">
        {rows?.map((r) => (
          <li key={r.id} className="flex items-stretch gap-2">
            <Link
              href={`/app?dossier=${r.id}`}
              className="card card-hover flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5"
            >
              <span className={`badge shrink-0 ${r.operation === "achat" ? "badge-stock" : "badge-vendu"}`}>
                {r.operation === "achat" ? "Achat" : "Vente"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-100">{r.label || "Dossier"}</p>
                <p className="truncate text-xs text-slate-400">
                  {r.immat ?? "-"} · {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  {r.linked_dossier_id && " · lié à une reprise"}
                </p>
              </div>
              {fmtPrix(r.prix) && (
                <span className="shrink-0 whitespace-nowrap text-sm font-bold text-slate-100">
                  {fmtPrix(r.prix)}
                </span>
              )}
              <span className="hidden shrink-0 text-sm font-medium text-accent sm:inline">Rouvrir →</span>
            </Link>
            <button
              onClick={() => remove(r.id)}
              title="Supprimer"
              aria-label="Supprimer"
              className="shrink-0 rounded-xl border border-slate-800 px-3 text-sm text-slate-500 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      </main>
    </>
  );
}

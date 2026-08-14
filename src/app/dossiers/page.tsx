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
};

export default function DossiersPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("dossiers")
        .select("id, label, operation, immat, status, created_at, linked_dossier_id")
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mes dossiers</h1>
        <Link
          href="/"
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700"
        >
          + Nouveau dossier
        </Link>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!rows && !error && <p className="text-sm text-slate-500">Chargement…</p>}
      {rows && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Aucun dossier enregistré pour l'instant.
          <br />
          <Link href="/" className="mt-2 inline-block font-medium text-brand-600 hover:underline">Créer un premier dossier</Link>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {rows?.map((r) => (
          <li key={r.id} className="flex items-stretch gap-2">
            <Link
              href={`/?dossier=${r.id}`}
              className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-300 hover:shadow-sm"
            >
              <span
                className={`rounded-md px-2 py-1 text-xs font-semibold ${
                  r.operation === "achat" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {r.operation === "achat" ? "Achat" : "Vente"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{r.label || "Dossier"}</p>
                <p className="text-xs text-slate-500">
                  {r.immat ?? "—"} · {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  {r.linked_dossier_id && " · lié à une reprise"}
                </p>
              </div>
              <span className="text-sm text-brand-600">Rouvrir →</span>
            </Link>
            <button
              onClick={() => remove(r.id)}
              title="Supprimer"
              className="rounded-xl border border-slate-200 px-3 text-sm text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
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

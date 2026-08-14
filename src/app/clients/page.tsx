"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/AppHeader";

type Row = {
  id: string;
  name: string | null;
  kind: string | null;
  commune: string | null;
  birth_date: string | null;
  dossiers: { count: number }[];
};

export default function ClientsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, kind, commune, birth_date, dossiers(count)")
        .order("name");
      if (error) setError(error.message);
      else setRows((data ?? []) as Row[]);
    })();
  }, []);

  const filtered = rows?.filter((r) => (r.name ?? "").toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-5">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-slate-900">Clients</h1>
        <p className="mb-5 text-sm text-slate-500">
          Chaque dossier enregistré crée ou met à jour automatiquement la fiche du client.
        </p>

        {rows && rows.length > 0 && (
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un client…"
            className="mb-4 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        )}

        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {!rows && !error && <p className="text-sm text-slate-500">Chargement…</p>}
        {rows && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Aucun client pour l'instant. Ils apparaîtront ici dès que tu enregistres un dossier.
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {filtered?.map((r) => (
            <li key={r.id}>
              <Link
                href={`/clients/${r.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-300 hover:shadow-sm"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                  {(r.name ?? "?").trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{r.name || "Sans nom"}</p>
                  <p className="truncate text-xs text-slate-500">
                    {r.commune ?? "—"}
                    {r.birth_date && ` · né(e) le ${r.birth_date}`}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {r.dossiers?.[0]?.count ?? 0} dossier{(r.dossiers?.[0]?.count ?? 0) > 1 ? "s" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

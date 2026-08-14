"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/AppHeader";

type Entry = {
  id: string;
  num: number;
  sens: "entree" | "sortie";
  recorded_at: string;
  marque: string | null;
  type: string | null;
  vin: string | null;
  immat: string | null;
  date_immat: string | null;
  person_name: string | null;
  person_address: string | null;
};

export default function LivrePolicePage() {
  const [rows, setRows] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("livre_police")
        .select("id, num, sens, recorded_at, marque, type, vin, immat, date_immat, person_name, person_address")
        .order("num", { ascending: false });
      if (error) setError(error.message);
      else setRows((data ?? []) as Entry[]);
    })();
  }, []);

  function exportCsv() {
    if (!rows) return;
    const header = ["N°", "Sens", "Date", "Marque", "Type", "Immatriculation", "VIN", "1re immat.", "Contrepartie", "Adresse"];
    const lines = [...rows]
      .sort((a, b) => a.num - b.num)
      .map((r) =>
        [
          r.num,
          r.sens === "entree" ? "Entrée" : "Sortie",
          new Date(r.recorded_at).toLocaleDateString("fr-FR"),
          r.marque ?? "",
          r.type ?? "",
          r.immat ?? "",
          r.vin ?? "",
          r.date_immat ?? "",
          r.person_name ?? "",
          r.person_address ?? "",
        ]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(";"),
      );
    const csv = "﻿" + [header.join(";"), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "livre-police.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-5">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Livre de police</h1>
          {rows && rows.length > 0 && (
            <button
              onClick={exportCsv}
              className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700"
            >
              Exporter (CSV)
            </button>
          )}
        </div>
        <p className="mb-5 text-sm text-slate-500">
          Registre des mouvements — chaque achat (entrée) et vente (sortie) y est inscrit automatiquement, numéroté et horodaté.
        </p>

        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {!rows && !error && <p className="text-sm text-slate-500">Chargement…</p>}
        {rows && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Registre vide. Les mouvements s'inscrivent dès que tu enregistres un dossier (achat ou vente).
          </div>
        )}

        {rows && rows.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">N°</th>
                  <th className="px-4 py-3">Mouvement</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Véhicule</th>
                  <th className="px-4 py-3">Contrepartie</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-mono text-slate-500">{r.num}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${
                          r.sens === "entree" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {r.sens === "entree" ? "Entrée" : "Sortie"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {new Date(r.recorded_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">
                        {[r.marque, r.type].filter(Boolean).join(" ") || "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.immat ?? "—"}
                        {r.vin && ` · ${r.vin}`}
                        {r.date_immat && ` · 1re MEC ${r.date_immat}`}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{r.person_name || "—"}</p>
                      <p className="text-xs text-slate-500">{r.person_address || ""}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

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
  km: string | null;
  genre: string | null;
  couleur: string | null;
  prix: string | null;
  paiement: string | null;
  person_name: string | null;
  person_address: string | null;
  id_type: string | null;
  id_number: string | null;
  id_authority: string | null;
};

const ord = (r: Entry) => `${new Date(r.recorded_at).getFullYear()}-${String(r.num).padStart(3, "0")}`;

export default function LivrePolicePage() {
  const [rows, setRows] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("livre_police")
        .select("*")
        .order("num", { ascending: true });
      if (error) setError(error.message);
      else setRows((data ?? []) as Entry[]);
    })();
  }, []);

  function exportCsv() {
    if (!rows) return;
    const header = [
      "N°", "Mouvement", "Date", "Genre", "Marque", "Type", "Immatriculation", "VIN", "1re immat.",
      "Km", "Couleur", "Prix", "Paiement", "Contrepartie", "Adresse", "Pièce ID", "N° pièce", "Autorité",
    ];
    const lines = rows.map((r) =>
      [
        ord(r), r.sens === "entree" ? "Entrée" : "Sortie", new Date(r.recorded_at).toLocaleDateString("fr-FR"),
        r.genre, r.marque, r.type, r.immat, r.vin, r.date_immat, r.km, r.couleur, r.prix, r.paiement,
        r.person_name, r.person_address, r.id_type, r.id_number, r.id_authority,
      ]
        .map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`)
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
      <style>{`@media print { @page { size: A4 landscape; margin: 10mm; } }`}</style>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Livre de police</h1>
          {rows && rows.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Imprimer / PDF
              </button>
              <button
                onClick={exportCsv}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700"
              >
                Exporter (CSV)
              </button>
            </div>
          )}
        </div>
        <p className="mb-5 text-sm text-slate-500 print:hidden">
          Registre des mouvements — inscrit automatiquement, numéroté, horodaté et non modifiable.
        </p>

        {/* En-tête d'impression */}
        <div className="mb-4 hidden print:block">
          <h1 className="text-xl font-bold">Livre de police — registre des véhicules d'occasion</h1>
          <p className="text-sm">Édité le {new Date().toLocaleDateString("fr-FR")}</p>
        </div>

        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {!rows && !error && <p className="text-sm text-slate-500">Chargement…</p>}
        {rows && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Registre vide. Les mouvements s'inscrivent dès que tu enregistres un dossier.
          </div>
        )}

        {rows && rows.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">N°</th>
                  <th className="px-3 py-3">Mvt</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Véhicule</th>
                  <th className="px-3 py-3">Contrepartie</th>
                  <th className="px-3 py-3">Prix</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 align-top last:border-0">
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-500">{ord(r)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${
                          r.sens === "entree" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {r.sens === "entree" ? "Entrée" : "Sortie"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                      {new Date(r.recorded_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-800">{[r.marque, r.type].filter(Boolean).join(" ") || "—"}</p>
                      <p className="text-xs text-slate-500">
                        {[r.immat, r.genre, r.couleur, r.km && `${r.km} km`].filter(Boolean).join(" · ")}
                      </p>
                      {r.vin && <p className="font-mono text-xs text-slate-400">{r.vin}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-800">{r.person_name || "—"}</p>
                      <p className="text-xs text-slate-500">{r.person_address}</p>
                      {(r.id_type || r.id_number) && (
                        <p className="text-xs text-slate-400">
                          {[r.id_type, r.id_number, r.id_authority].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="font-medium text-slate-800">{r.prix ? `${r.prix} €` : "—"}</p>
                      <p className="text-xs text-slate-500">{r.paiement}</p>
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

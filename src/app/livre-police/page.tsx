"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/AppHeader";

type Entry = {
  id: string;
  org_id: string;
  num: number;
  sens: "entree" | "sortie" | "annulation";
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
  destination: string | null;
  date_mouvement: string | null;
  person_name: string | null;
  person_address: string | null;
  person_is_pro: boolean | null;
  person_siret: string | null;
  id_type: string | null;
  id_number: string | null;
  id_authority: string | null;
  id_issue_date: string | null;
  cancels_id: string | null;
  motif: string | null;
};

type Org = {
  name: string | null;
  siren: string | null;
  address_line: string | null;
  postal_code: string | null;
  city: string | null;
};

const ord = (r: Entry) => `${new Date(r.recorded_at).getFullYear()}-${String(r.num).padStart(3, "0")}`;
// Date réelle du mouvement (entrée/sortie) ; à défaut, l'horodatage d'inscription.
const mvtDate = (r: Entry) => r.date_mouvement || new Date(r.recorded_at).toLocaleDateString("fr-FR");

const DEST: Record<string, string> = {
  vente: "Vente",
  depot_vente: "Dépôt-vente",
  restitution: "Restitution",
  destruction: "Destruction",
};
const destLabel = (d: string | null) => (d ? DEST[d] ?? d : "");

export default function LivrePolicePage() {
  const [rows, setRows] = useState<Entry[] | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data: m } = await supabase.from("memberships").select("org_id").limit(1).maybeSingle();
    if (m?.org_id) {
      const { data: o } = await supabase
        .from("organizations")
        .select("name, siren, address_line, postal_code, city")
        .eq("id", m.org_id)
        .maybeSingle();
      setOrg((o ?? null) as Org | null);
    }
    const { data, error } = await supabase
      .from("livre_police")
      .select("*")
      .order("num", { ascending: true });
    if (error) setError(error.message);
    else setRows((data ?? []) as Entry[]);
  }

  useEffect(() => {
    load();
  }, []);

  // Map : id de la ligne annulée -> n° de l'écriture d'annulation.
  const cancelledBy = new Map<string, number>();
  (rows ?? []).forEach((r) => {
    if (r.sens === "annulation" && r.cancels_id) cancelledBy.set(r.cancels_id, r.num);
  });

  async function cancel(row: Entry) {
    const motif = window.prompt(`Motif de l'annulation du n° ${ord(row)} ?`);
    if (motif === null) return;
    if (!motif.trim()) {
      setError("Un motif est obligatoire pour annuler une écriture.");
      return;
    }
    setError(null);
    const supabase = createClient();
    const { data: last } = await supabase
      .from("livre_police")
      .select("num")
      .eq("org_id", row.org_id)
      .order("num", { ascending: false })
      .limit(1)
      .maybeSingle();
    const num = ((last?.num as number) ?? 0) + 1;
    const { error } = await supabase.from("livre_police").insert({
      org_id: row.org_id,
      num,
      sens: "annulation",
      cancels_id: row.id,
      motif: motif.trim(),
      marque: row.marque,
      type: row.type,
      immat: row.immat,
      vin: row.vin,
    });
    if (error) setError(error.message);
    else await load();
  }

  const orgAddress = org
    ? [org.address_line, [org.postal_code, org.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")
    : "";

  function exportCsv() {
    if (!rows) return;
    const meta = [
      ["Établissement", org?.name ?? ""],
      ["SIREN", org?.siren ?? ""],
      ["Adresse", orgAddress],
      ["Édité le", new Date().toLocaleDateString("fr-FR")],
      [],
    ];
    const header = [
      "N°", "Mouvement", "Date du mouvement", "Inscrit le", "Genre", "Marque", "Type",
      "Immatriculation", "VIN", "1re immat.", "Km", "Couleur", "Prix", "Paiement", "Destination",
      "Contrepartie", "Type contrepartie", "SIRET", "Adresse", "Pièce ID", "N° pièce", "Autorité",
      "Délivrée le", "État / Motif",
    ];
    const line = (r: Entry) => {
      const etat =
        r.sens === "annulation"
          ? `Annulation du n° ${r.cancels_id ? "(voir ligne liée)" : ""} — ${r.motif ?? ""}`
          : cancelledBy.has(r.id)
            ? `Annulée par n° ${cancelledBy.get(r.id)}`
            : "";
      const mvt = r.sens === "entree" ? "Entrée" : r.sens === "sortie" ? "Sortie" : "Annulation";
      return [
        ord(r), mvt, r.sens === "annulation" ? "" : mvtDate(r),
        new Date(r.recorded_at).toLocaleDateString("fr-FR"),
        r.genre, r.marque, r.type, r.immat, r.vin, r.date_immat, r.km, r.couleur, r.prix, r.paiement,
        destLabel(r.destination), r.person_name, r.person_is_pro ? "Professionnel" : "Particulier",
        r.person_siret, r.person_address, r.id_type, r.id_number, r.id_authority, r.id_issue_date, etat,
      ];
    };
    const rowsCsv = [...meta, header, ...rows.map(line)].map((cells) =>
      cells.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"),
    );
    const csv = "﻿" + rowsCsv.join("\n");
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
        <p className="mb-4 text-sm text-slate-500 print:hidden">
          Registre des mouvements — inscrit automatiquement, numéroté, horodaté et non modifiable.
          Une erreur s'annule (elle n'est jamais supprimée).
        </p>

        {/* En-tête établissement (écran + impression) */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 print:border-slate-300 print:bg-white">
          <p className="text-base font-bold text-slate-900">
            {org?.name || "Établissement"}
            <span className="ml-2 text-sm font-normal text-slate-500 print:hidden">
              — <a href="/compte" className="text-brand-600 hover:underline">modifier</a>
            </span>
          </p>
          <p className="text-sm text-slate-600">
            {[orgAddress, org?.siren && `SIREN ${org.siren}`].filter(Boolean).join(" · ") || "—"}
          </p>
          <p className="mt-0.5 hidden text-xs text-slate-500 print:block">
            Livre de police — registre des véhicules d'occasion · édité le{" "}
            {new Date().toLocaleDateString("fr-FR")}
          </p>
        </div>

        {error && <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {!rows && !error && <p className="text-sm text-slate-500">Chargement…</p>}
        {rows && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Registre vide. Les mouvements s'inscrivent dès que tu enregistres un dossier.
          </div>
        )}

        {rows && rows.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">N°</th>
                  <th className="px-3 py-3">Mvt</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Véhicule</th>
                  <th className="px-3 py-3">Contrepartie</th>
                  <th className="px-3 py-3">Prix</th>
                  <th className="px-3 py-3 print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  if (r.sens === "annulation") {
                    return (
                      <tr key={r.id} className="border-b border-slate-100 bg-red-50/40 align-top last:border-0">
                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-500">{ord(r)}</td>
                        <td className="px-3 py-3">
                          <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                            Annulation
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                          {new Date(r.recorded_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-3 py-3 text-slate-600" colSpan={3}>
                          Annulation d'une écriture antérieure
                          {r.immat ? ` — ${r.immat}` : ""}
                          {r.motif ? ` · Motif : ${r.motif}` : ""}
                        </td>
                        <td className="px-3 py-3 print:hidden"></td>
                      </tr>
                    );
                  }
                  const isCancelled = cancelledBy.has(r.id);
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-slate-100 align-top last:border-0 ${isCancelled ? "text-slate-400" : ""}`}
                    >
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-500">{ord(r)}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-semibold ${
                            r.sens === "entree" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          } ${isCancelled ? "opacity-60" : ""}`}
                        >
                          {r.sens === "entree" ? "Entrée" : "Sortie"}
                        </span>
                        {isCancelled && (
                          <span className="mt-1 block text-xs font-semibold text-red-600">
                            Annulée par n° {cancelledBy.get(r.id)}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <p className="text-slate-700">{mvtDate(r)}</p>
                        <p className="text-xs text-slate-400">inscrit le {new Date(r.recorded_at).toLocaleDateString("fr-FR")}</p>
                      </td>
                      <td className={`px-3 py-3 ${isCancelled ? "line-through" : ""}`}>
                        <p className="font-medium text-slate-800">{[r.marque, r.type].filter(Boolean).join(" ") || "—"}</p>
                        <p className="text-xs text-slate-500">
                          {[r.immat, r.genre, r.couleur, r.km && `${r.km} km`].filter(Boolean).join(" · ")}
                        </p>
                        {r.vin && <p className="font-mono text-xs text-slate-400">{r.vin}</p>}
                        {r.sens === "sortie" && r.destination && (
                          <p className="text-xs text-slate-500">Destination : {destLabel(r.destination)}</p>
                        )}
                      </td>
                      <td className={`px-3 py-3 ${isCancelled ? "line-through" : ""}`}>
                        <p className="font-medium text-slate-800">
                          {r.person_name || "—"}
                          {r.person_is_pro && (
                            <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                              PRO
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{r.person_address}</p>
                        {r.person_is_pro
                          ? r.person_siret && <p className="text-xs text-slate-400">SIRET {r.person_siret}</p>
                          : (r.id_type || r.id_number) && (
                              <p className="text-xs text-slate-400">
                                {[
                                  r.id_type,
                                  r.id_number,
                                  r.id_authority,
                                  r.id_issue_date && `délivrée le ${r.id_issue_date}`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                      </td>
                      <td className={`whitespace-nowrap px-3 py-3 ${isCancelled ? "line-through" : ""}`}>
                        <p className="font-medium text-slate-800">{r.prix ? `${r.prix} €` : "—"}</p>
                        <p className="text-xs text-slate-500">{r.paiement}</p>
                      </td>
                      <td className="px-3 py-3 print:hidden">
                        {!isCancelled && (
                          <button
                            onClick={() => cancel(r)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            Annuler
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

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
  denom: string | null;
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

function DRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "" || value === false) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <span className="shrink-0 text-xs text-slate-400">{label}</span>
      <span className="text-right text-sm font-medium text-slate-100">{value}</span>
    </div>
  );
}

function DSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-800 py-2 first:border-0">
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">{title}</h4>
      {children}
    </div>
  );
}

export default function LivrePolicePage() {
  const [rows, setRows] = useState<Entry[] | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Entry | null>(null);

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

  const needle = q.trim().toLowerCase();
  const visible = (rows ?? []).filter((r) => {
    if (!needle) return true;
    return [r.immat, r.vin, r.marque, r.type, r.person_name, r.genre]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(needle));
  });

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
      "N°", "Mouvement", "Date du mouvement", "Inscrit le", "Genre", "Marque", "Dénomination", "Type",
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
        r.genre, r.marque, r.denom, r.type, r.immat, r.vin, r.date_immat, r.km, r.couleur, r.prix, r.paiement,
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
      <style>{`@media print {
        @page { size: A4 landscape; margin: 10mm; }
        body { background: #fff !important; }
        main, main * { color: #0f172a !important; background: transparent !important; border-color: #cbd5e1 !important; }
      }`}</style>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Livre de police</h1>
          {rows && rows.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-900/40"
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
        <p className="mb-4 text-sm text-slate-400 print:hidden">
          Registre des mouvements — inscrit automatiquement, numéroté, horodaté et non modifiable.
          Une erreur s'annule (elle n'est jamais supprimée).
        </p>

        {/* En-tête établissement (écran + impression) */}
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 print:border-slate-700 print:bg-white">
          <p className="text-base font-bold text-slate-100">
            {org?.name || "Établissement"}
            <span className="ml-2 text-sm font-normal text-slate-400 print:hidden">
              — <a href="/compte" className="text-brand-400 hover:underline">modifier</a>
            </span>
          </p>
          <p className="text-sm text-slate-300">
            {[orgAddress, org?.siren && `SIREN ${org.siren}`].filter(Boolean).join(" · ") || "—"}
          </p>
          <p className="mt-0.5 hidden text-xs text-slate-400 print:block">
            Livre de police — registre des véhicules d'occasion · édité le{" "}
            {new Date().toLocaleDateString("fr-FR")}
          </p>
        </div>

        {error && <p className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
        {!rows && !error && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}
          </div>
        )}
        {rows && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
            Registre vide. Les mouvements s'inscrivent dès que tu enregistres un dossier.
          </div>
        )}

        {rows && rows.length > 0 && (
          <div className="relative mb-3 print:hidden">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par plaque, VIN, modèle…"
              className="input pl-10"
            />
          </div>
        )}

        {rows && rows.length > 0 && visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-sm text-slate-400 print:hidden">
            Aucun véhicule ne correspond à « {q} ».
          </div>
        )}

        {rows && visible.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 shadow-sm print:border-0 print:bg-white print:shadow-none">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-400">
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
                {visible.map((r) => {
                  if (r.sens === "annulation") {
                    return (
                      <tr key={r.id} onClick={() => setSelected(r)} className="cursor-pointer border-b border-slate-800 bg-red-500/5 align-top transition last:border-0 hover:bg-red-500/10">
                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-400">{ord(r)}</td>
                        <td className="px-3 py-3">
                          <span className="rounded-md bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-300">
                            Annulation
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-slate-300">
                          {new Date(r.recorded_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-3 py-3 text-slate-300" colSpan={3}>
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
                      onClick={() => setSelected(r)}
                      className={`cursor-pointer border-b border-slate-800 align-top transition last:border-0 hover:bg-slate-800/40 ${isCancelled ? "text-slate-400" : ""}`}
                    >
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-400">{ord(r)}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`badge ${r.sens === "entree" ? "badge-stock" : "badge-vendu"} ${
                            isCancelled ? "opacity-60" : ""
                          }`}
                        >
                          {r.sens === "entree" ? "Entrée" : "Sortie"}
                        </span>
                        {isCancelled && (
                          <span className="mt-1 block text-xs font-semibold text-red-400">
                            Annulée par n° {cancelledBy.get(r.id)}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <p className="text-slate-200">{mvtDate(r)}</p>
                        <p className="text-xs text-slate-400">inscrit le {new Date(r.recorded_at).toLocaleDateString("fr-FR")}</p>
                      </td>
                      <td className={`px-3 py-3 ${isCancelled ? "line-through" : ""}`}>
                        <p className="font-medium text-slate-200">{[r.marque, r.type].filter(Boolean).join(" ") || "—"}</p>
                        <p className="text-xs text-slate-400">
                          {[r.immat, r.genre, r.couleur, r.km && `${r.km} km`].filter(Boolean).join(" · ")}
                        </p>
                        {r.vin && <p className="font-mono text-xs text-slate-400">{r.vin}</p>}
                        {r.sens === "sortie" && r.destination && (
                          <p className="text-xs text-slate-400">Destination : {destLabel(r.destination)}</p>
                        )}
                      </td>
                      <td className={`px-3 py-3 ${isCancelled ? "line-through" : ""}`}>
                        <p className="font-medium text-slate-200">
                          {r.person_name || "—"}
                          {r.person_is_pro && (
                            <span className="ml-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                              PRO
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">{r.person_address}</p>
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
                        <p className="font-medium text-slate-200">{r.prix ? `${r.prix} €` : "—"}</p>
                        <p className="text-xs text-slate-400">{r.paiement}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 print:hidden">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs font-medium text-accent">Détails</span>
                          {!isCancelled && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancel(r);
                              }}
                              className="rounded-lg border border-slate-800 px-2.5 py-1 text-xs text-slate-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4 print:hidden"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-slate-400">N° {ord(selected)}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`badge ${
                      selected.sens === "entree"
                        ? "badge-stock"
                        : selected.sens === "sortie"
                          ? "badge-vendu"
                          : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    {selected.sens === "entree" ? "Entrée" : selected.sens === "sortie" ? "Sortie" : "Annulation"}
                  </span>
                  {cancelledBy.has(selected.id) && (
                    <span className="text-xs font-semibold text-red-400">
                      Annulée par n° {cancelledBy.get(selected.id)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {selected.sens === "annulation" ? (
              <DSection title="Annulation">
                <DRow label="Motif" value={selected.motif} />
                <DRow label="Véhicule concerné" value={[selected.marque, selected.immat].filter(Boolean).join(" · ")} />
                <DRow label="Inscrite le" value={new Date(selected.recorded_at).toLocaleString("fr-FR")} />
              </DSection>
            ) : (
              <>
                <DSection title="Véhicule">
                  <DRow label="Genre" value={selected.genre} />
                  <DRow label="Marque" value={selected.marque} />
                  <DRow label="Dénomination" value={selected.denom} />
                  <DRow label="Type / version" value={selected.type} />
                  <DRow label="Immatriculation" value={selected.immat} />
                  <DRow label="VIN" value={selected.vin && <span className="font-mono">{selected.vin}</span>} />
                  <DRow label="1re immatriculation" value={selected.date_immat} />
                  <DRow label="Kilométrage" value={selected.km && `${selected.km} km`} />
                  <DRow label="Couleur" value={selected.couleur} />
                </DSection>

                <DSection title="Mouvement">
                  <DRow label={selected.sens === "entree" ? "Date d'entrée" : "Date de sortie"} value={mvtDate(selected)} />
                  <DRow label="Inscrit le" value={new Date(selected.recorded_at).toLocaleString("fr-FR")} />
                  {selected.sens === "sortie" && <DRow label="Destination" value={destLabel(selected.destination)} />}
                </DSection>

                <DSection title="Transaction">
                  <DRow label="Prix" value={selected.prix && `${selected.prix} €`} />
                  <DRow label="Règlement" value={selected.paiement} />
                </DSection>

                <DSection title={selected.sens === "entree" ? "Vendeur" : "Acheteur"}>
                  <DRow label="Nom / raison sociale" value={selected.person_name} />
                  <DRow label="Type" value={selected.person_is_pro ? "Professionnel" : "Particulier"} />
                  <DRow label="SIRET" value={selected.person_siret} />
                  <DRow label="Adresse" value={selected.person_address} />
                  <DRow label="Pièce d'identité" value={selected.id_type} />
                  <DRow label="N° de pièce" value={selected.id_number} />
                  <DRow label="Autorité" value={selected.id_authority} />
                  <DRow label="Délivrée le" value={selected.id_issue_date} />
                </DSection>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { DossierDocuments } from "@/components/DossierDocuments";
import type { CerfaDossier, Person } from "@/lib/cerfa/types";

type ExtractResponse = { dossier: CerfaDossier; error?: string };

const CERFAS = [
  { key: "15776", label: "Certificat de cession" },
  { key: "13751", label: "Déclaration d'achat" },
  { key: "13757", label: "Mandat" },
  { key: "13750", label: "Demande d'immatriculation" },
];

// Redimensionne + réencode une image en JPEG (photos iPhone lourdes / HEIC → JPEG léger).
// Évite la limite de taille Vercel (4,5 Mo) et fiabilise l'analyse.
async function downscaleImage(file: File): Promise<Blob> {
  const MAX = 2200; // dimension max (px)
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponible");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("échec toBlob"))), "image/jpeg", 0.85),
  );
}

// Prépare un fichier pour l'envoi : PDF tel quel, image redimensionnée en JPEG
// (repli sur l'original si le navigateur ne sait pas décoder l'image).
async function prepareUpload(file: File): Promise<{ blob: Blob; name: string }> {
  if (file.type === "application/pdf") return { blob: file, name: file.name };
  try {
    const blob = await downscaleImage(file);
    return { blob, name: file.name.replace(/\.[^.]+$/, "") + ".jpg" };
  } catch {
    return { blob: file, name: file.name };
  }
}

// Crée ou réutilise la fiche client (le particulier de l'opération) et renvoie son id.
async function upsertContact(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  dossier: CerfaDossier,
): Promise<string | null> {
  const p: Person = dossier.operation === "achat" ? dossier.cession.seller : dossier.cession.buyer;
  if (!p?.name) return null;
  const payload = {
    kind: p.kind === "morale" ? "morale" : "physique",
    name: p.name,
    birth_date: p.birthDate ?? null,
    cp: p.cp ?? null,
    commune: p.commune ?? null,
    siren: p.siret ?? null,
    data: p,
  };
  const { data: existing } = await supabase
    .from("contacts")
    .select("id")
    .eq("org_id", orgId)
    .ilike("name", p.name)
    .limit(1)
    .maybeSingle();
  if (existing?.id) {
    await supabase.from("contacts").update(payload).eq("id", existing.id);
    return existing.id;
  }
  const { data: created } = await supabase
    .from("contacts")
    .insert({ org_id: orgId, ...payload })
    .select("id")
    .single();
  return created?.id ?? null;
}

// Enregistre le mouvement au Livre de Police (une seule fois par dossier).
async function recordLivrePolice(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  dossier: CerfaDossier,
  dossierId: string,
) {
  const { data: ex } = await supabase
    .from("livre_police")
    .select("id")
    .eq("dossier_id", dossierId)
    .limit(1)
    .maybeSingle();
  if (ex?.id) return; // déjà au registre

  const { data: last } = await supabase
    .from("livre_police")
    .select("num")
    .eq("org_id", orgId)
    .order("num", { ascending: false })
    .limit(1)
    .maybeSingle();
  const num = ((last?.num as number) ?? 0) + 1;

  const v = dossier.vehicle;
  const p: Person = dossier.operation === "achat" ? dossier.cession.seller : dossier.cession.buyer;
  const address =
    [p?.noVoie, p?.typeVoie, p?.nomVoie, p?.cp, p?.commune].filter(Boolean).join(" ") || null;

  await supabase.from("livre_police").insert({
    org_id: orgId,
    num,
    sens: dossier.operation === "achat" ? "entree" : "sortie",
    dossier_id: dossierId,
    marque: v.marque ?? null,
    type: v.type ?? null,
    denom: v.denom ?? null,
    vin: v.vin ?? null,
    immat: v.immat ?? null,
    date_immat: v.dateB ?? null,
    km: v.km ?? null,
    genre: v.genre ?? null,
    couleur: v.couleur ?? null,
    prix: dossier.cession.prix ?? null,
    paiement: dossier.cession.paiement ?? null,
    destination:
      dossier.operation === "vente" ? dossier.cession.sortieDestination ?? "vente" : null,
    date_mouvement: dossier.cession.dateMouvement ?? dossier.cession.date ?? null,
    person_name: p?.name ?? null,
    person_address: address,
    person_is_pro: p?.kind === "morale",
    person_siret: p?.kind === "morale" ? p?.siret ?? null : null,
    id_type: p?.kind === "morale" ? null : p?.idType ?? null,
    id_number: p?.kind === "morale" ? null : p?.idNumber ?? null,
    id_authority: p?.kind === "morale" ? null : p?.idAuthority ?? null,
    id_issue_date: p?.kind === "morale" ? null : p?.idDate ?? null,
  });
}

export default function Home() {
  const [cgFile, setCgFile] = useState<File | null>(null);
  const [cniFile, setCniFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dossier, setDossier] = useState<CerfaDossier | null>(null);
  const [docs, setDocs] = useState<{ key: string; label: string; url: string }[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [lpInfo, setLpInfo] = useState<{ num: number; year: number } | null>(null); // registre : inscrit ?
  const [pushing, setPushing] = useState(false);
  const [linkTo, setLinkTo] = useState<string | null>(null); // reprise liée à cette vente
  const [viewMode, setViewMode] = useState<"edit" | "view">("edit"); // view = dossier ouvert (docs), edit = analyse/formulaire
  const [includePro, setIncludePro] = useState(true);
  const [mode, setMode] = useState<"vente" | "vente_reprise" | "achat">("vente");
  const operation: "achat" | "vente" = mode === "achat" ? "achat" : "vente";

  // Réouverture (?dossier=<id>) ou démarrage d'une reprise liée (?reprise=<venteId>).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reprise = params.get("reprise");
    if (reprise) {
      setMode("achat"); // la reprise = le pro rachète le véhicule repris
      setLinkTo(reprise);
      return;
    }
    const id = params.get("dossier");
    if (!id) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("dossiers").select("data").eq("id", id).maybeSingle();
      const d = data?.data as CerfaDossier | undefined;
      if (d) {
        setDossier(d);
        setSavedId(id);
        setMode(d.operation === "achat" ? "achat" : "vente");
        setViewMode("view"); // ouvrir un dossier = voir ses documents
        await checkLivrePolice(supabase, id);
      }
    })();
  }, []);

  // Changer d'opération : inverse vendeur/acheteur en direct si un dossier existe déjà.
  function changeMode(m: "vente" | "vente_reprise" | "achat") {
    setMode(m);
    const newOp: "achat" | "vente" = m === "achat" ? "achat" : "vente";
    setDossier((d) => {
      if (!d) return d;
      if (d.operation === newOp) return { ...d, operation: newOp };
      const c = d.cession;
      return {
        ...d,
        operation: newOp,
        cession: {
          ...c,
          seller: c.buyer,
          buyer: c.seller,
          lieuFaitSeller: c.lieuFaitBuyer ?? null,
          lieuFaitBuyer: c.lieuFaitSeller ?? null,
        },
      };
    });
  }

  const upd = (fn: (d: CerfaDossier) => void) =>
    setDossier((prev) => {
      if (!prev) return prev;
      const d: CerfaDossier = structuredClone(prev);
      fn(d);
      return d;
    });

  async function analyze() {
    setError(null);
    setDocs([]);
    if (!cgFile && !cniFile) {
      setError("Ajoute au moins une photo (carte grise et/ou CNI).");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("operation", operation);
      if (cgFile) {
        const p = await prepareUpload(cgFile);
        fd.append("carteGrise", p.blob, p.name);
      }
      if (cniFile) {
        const p = await prepareUpload(cniFile);
        fd.append("cni", p.blob, p.name);
      }
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const raw = await res.text();
      let json: ExtractResponse;
      try {
        json = JSON.parse(raw) as ExtractResponse;
      } catch {
        throw new Error(
          `Réponse inattendue du serveur (${res.status}). ${raw.slice(0, 140) || "Réessaie."}`,
        );
      }
      if (!res.ok) throw new Error(json.error || "Échec de l'analyse.");
      setDossier(json.dossier);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setLoading(false);
    }
  }

  async function generate(key: string) {
    if (!dossier) return;
    setGenerating(key);
    setError(null);
    try {
      const payload = includePro ? dossier : { ...dossier, pro: undefined };
      const res = await fetch(`/api/cerfa/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Échec de la génération.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const label = CERFAS.find((c) => c.key === key)?.label ?? "Document";
      setDocs((prev) => [...prev.filter((d) => d.key !== key), { key, label, url }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setGenerating(null);
    }
  }

  // Statut « déjà inscrit au livre de police ? » pour ce dossier.
  async function checkLivrePolice(
    supabase: ReturnType<typeof createClient>,
    dossierId: string,
  ) {
    const { data } = await supabase
      .from("livre_police")
      .select("num, recorded_at")
      .eq("dossier_id", dossierId)
      .neq("sens", "annulation")
      .limit(1)
      .maybeSingle();
    setLpInfo(
      data ? { num: data.num as number, year: new Date(data.recorded_at as string).getFullYear() } : null,
    );
  }

  async function saveDossier(): Promise<string | null> {
    if (!dossier) return null;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: m } = await supabase.from("memberships").select("org_id").limit(1).maybeSingle();
      if (!m?.org_id) throw new Error("Organisation introuvable.");
      const orgId = m.org_id;

      // Fiche client (le particulier de l'opération) — créée/réutilisée.
      const contactId = await upsertContact(supabase, orgId, dossier);

      const c = dossier.cession;
      const label =
        [dossier.vehicle.marque, dossier.vehicle.denom, "—", c.buyer.name ?? c.seller.name]
          .filter(Boolean)
          .join(" ") || "Dossier";
      const fields = {
        operation: dossier.operation,
        immat: dossier.vehicle.immat,
        label,
        data: dossier,
        contact_id: contactId,
      };

      let dossierId = savedId;
      if (savedId) {
        // Mise à jour du dossier existant.
        const { error } = await supabase.from("dossiers").update(fields).eq("id", savedId);
        if (error) throw error;
      } else {
        // Création.
        const { data, error } = await supabase
          .from("dossiers")
          .insert({ org_id: orgId, status: "ready", linked_dossier_id: linkTo, ...fields })
          .select("id")
          .single();
        if (error) throw error;
        dossierId = data.id;
        setSavedId(data.id);
      }
      return dossierId;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'enregistrement.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  // Le pro décide quand le dossier est complet : il l'envoie au livre de police.
  async function pushToLivrePolice() {
    if (!dossier) return;
    setPushing(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: m } = await supabase.from("memberships").select("org_id").limit(1).maybeSingle();
      if (!m?.org_id) throw new Error("Organisation introuvable.");
      // On enregistre d'abord le dossier (données à jour), puis on l'inscrit.
      const dossierId = (await saveDossier()) ?? savedId;
      if (!dossierId) throw new Error("Enregistre le dossier d'abord.");
      await recordLivrePolice(supabase, m.org_id, dossier, dossierId);
      await checkLivrePolice(supabase, dossierId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi au livre de police.");
    } finally {
      setPushing(false);
    }
  }

  const relevantCerfas = CERFAS.filter((c) =>
    (operation === "achat" ? ["15776", "13751"] : ["15776", "13750", "13757"]).includes(c.key),
  );
  const documentsButtons = (
    <div className="flex flex-wrap gap-2">
      {relevantCerfas.map((c) => {
        const done = docs.some((d) => d.key === c.key);
        return (
          <button
            key={c.key}
            onClick={() => generate(c.key)}
            disabled={generating !== null}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
              done
                ? "border border-slate-800 bg-slate-800/40 text-slate-400"
                : "bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700"
            }`}
          >
            {generating === c.key ? "Génération…" : done ? `✓ ${c.label} — régénérer` : c.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-5 sm:py-8">

      {viewMode === "edit" && !dossier && (
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Scanner un document
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Carte grise + pièce d'identité → vos Cerfa remplis en quelques secondes.
          </p>
        </div>
      )}

      {viewMode === "edit" && (
        <ol className="mb-6 flex items-center gap-2 text-xs font-medium">
          {[
            { n: 1, label: "Scan", on: true },
            { n: 2, label: "Vérifier", on: !!dossier },
            { n: 3, label: "Documents", on: docs.length > 0 },
          ].map((s, i) => (
            <li key={s.n} className="flex flex-1 items-center gap-2">
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                  s.on ? "bg-gradient-to-br from-cyan-400 to-brand-500 text-slate-950" : "bg-slate-800 text-slate-500"
                }`}
              >
                {s.n}
              </span>
              <span className={s.on ? "text-slate-200" : "text-slate-500"}>{s.label}</span>
              {i < 2 && <span className={`h-px flex-1 ${s.on ? "bg-slate-700" : "bg-slate-800"}`} />}
            </li>
          ))}
        </ol>
      )}

      {linkTo && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <strong>Reprise</strong> — ce dossier (achat) sera rattaché à la vente précédente. Dépose la carte grise
          &amp; la pièce d'identité du véhicule <strong>repris</strong>.
        </div>
      )}

      {/* Vue CONSULTATION d'un dossier enregistré */}
      {viewMode === "view" && dossier && (
        <section className="card p-5 shadow-xl shadow-black/20">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <span
                className={`rounded-md px-2 py-1 text-xs font-semibold ${
                  dossier.operation === "achat" ? "badge-stock" : "badge-vendu"
                }`}
              >
                {dossier.operation === "achat" ? "Achat" : "Vente"}
              </span>
              <h2 className="mt-2 text-lg font-bold text-slate-100">
                {[dossier.vehicle.marque, dossier.vehicle.denom].filter(Boolean).join(" ") || "Dossier"}
              </h2>
              <p className="text-sm text-slate-400">
                {dossier.vehicle.immat ?? "—"} ·{" "}
                {dossier.operation === "achat" ? "Vendeur" : "Acheteur"} :{" "}
                {(dossier.operation === "achat" ? dossier.cession.seller.name : dossier.cession.buyer.name) ?? "—"}
              </p>
            </div>
            <Link href="/dossiers" className="whitespace-nowrap text-sm font-medium text-brand-400 hover:underline">
              ← Mes dossiers
            </Link>
          </div>

          <h3 className="mt-4 mb-1 text-sm font-semibold text-slate-200">Documents</h3>
          <p className="mb-2 text-xs text-slate-400">Clique sur un document pour l'afficher (PDF).</p>
          {documentsButtons}

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4">
            <button
              onClick={() => setViewMode("edit")}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              ✎ Modifier / Réanalyser
            </button>
            {lpInfo ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300">
                ✓ Inscrit au livre de police (n° {lpInfo.year}-{String(lpInfo.num).padStart(3, "0")})
              </span>
            ) : (
              <button
                onClick={pushToLivrePolice}
                disabled={pushing}
                className="rounded-xl border border-accent/50 bg-brand-500/15 px-4 py-2.5 text-sm font-semibold text-brand-200 transition hover:bg-brand-500/25 disabled:opacity-50"
              >
                {pushing ? "Envoi…" : "📖 Envoyer au livre de police"}
              </button>
            )}
            {dossier.operation === "vente" && savedId && (
              <a
                href={`/?reprise=${savedId}`}
                className="rounded-xl bg-amber-500/100 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600"
              >
                + Ajouter la reprise
              </a>
            )}
          </div>

          {savedId && <DossierDocuments dossierId={savedId} />}
        </section>
      )}

      {/* Étape 1 : upload (mode édition) */}
      {viewMode === "edit" && (
      <section className="card p-5 shadow-xl shadow-black/20">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          1 · Type d'opération
        </h2>
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          {([
            ["vente", "Je vends"],
            ["vente_reprise", "Vente + reprise"],
            ["achat", "J'achète"],
          ] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => changeMode(m)}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                mode === m
                  ? "border-accent/60 bg-brand-500/15 text-brand-200 shadow-lg shadow-brand-600/10"
                  : "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {mode === "vente_reprise" && (
          <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            Reprise : on traite d'abord <strong>la vente</strong> ci-dessous. Pour le véhicule repris,
            tu créeras un 2ᵉ dossier « J'achète » (les deux seront liés une fois la sauvegarde des dossiers en place).
          </p>
        )}
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          2 · Photos
        </h2>
        <p className="mb-3 text-xs text-slate-400">
          {operation === "achat"
            ? "Carte grise du véhicule + pièce d'identité du vendeur (le particulier)."
            : "Carte grise du véhicule + pièce d'identité de l'acheteur (le particulier)."}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FileInput label="Carte grise" file={cgFile} onChange={setCgFile} />
          <FileInput label="Pièce d'identité (CNI ou passeport)" file={cniFile} onChange={setCniFile} />
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className="btn-cyan mt-5 w-full sm:w-auto"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/40 border-t-slate-900" />
              Analyse en cours…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Analyser
            </>
          )}
        </button>

        {loading && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-sm text-accent">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              Lecture du document · extraction du VIN…
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="skeleton h-3 w-20" />
                  <div className="skeleton h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Étape 2 : formulaire (mode édition) */}
      {viewMode === "edit" && dossier && (
        <section className="mt-6 card p-5 shadow-xl shadow-black/20">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              2 · Vérifier &amp; compléter
            </h2>
            <button
              onClick={() => {
                setCgFile(null);
                setCniFile(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-sm font-medium text-brand-400 hover:underline"
            >
              ↑ Refaire l'analyse
            </button>
          </div>

          <Group title="Véhicule">
            <Field label="Immatriculation (A)" value={dossier.vehicle.immat} onChange={(v) => upd((d) => (d.vehicle.immat = v))} />
            <Field label="1re immatriculation (B)" value={dossier.vehicle.dateB} onChange={(v) => upd((d) => (d.vehicle.dateB = v))} />
            <Field label="VIN (E)" value={dossier.vehicle.vin} onChange={(v) => upd((d) => (d.vehicle.vin = v))} />
            <Field label="Marque (D.1)" value={dossier.vehicle.marque} onChange={(v) => upd((d) => (d.vehicle.marque = v))} />
            <Field label="Type (D.2)" value={dossier.vehicle.type} onChange={(v) => upd((d) => (d.vehicle.type = v))} />
            <Field label="Dénomination (D.3)" value={dossier.vehicle.denom} onChange={(v) => upd((d) => (d.vehicle.denom = v))} />
            <Field label="Kilométrage" value={dossier.vehicle.km} onChange={(v) => upd((d) => (d.vehicle.km = v))} />
            <Field label="N° de formule" value={dossier.vehicle.formule} onChange={(v) => upd((d) => (d.vehicle.formule = v))} />
            <Field label="Genre (J.1)" value={dossier.vehicle.genre} onChange={(v) => upd((d) => (d.vehicle.genre = v))} placeholder="VP, CTTE…" />
            <Field label="Couleur" value={dossier.vehicle.couleur} onChange={(v) => upd((d) => (d.vehicle.couleur = v))} placeholder="Livre de police" />
          </Group>

          <PersonGroup
            title="Vendeur (ancien propriétaire)"
            person={dossier.cession.seller}
            birth={operation === "achat"}
            idDoc={operation === "achat"}
            allowPro={operation === "achat"}
            onField={(k, v) => upd((d) => ((d.cession.seller[k] as string | null) = v))}
          />
          <PersonGroup
            title="Acheteur (nouveau propriétaire)"
            person={dossier.cession.buyer}
            birth
            idDoc={operation === "vente"}
            allowPro={operation === "vente"}
            onField={(k, v) => upd((d) => ((d.cession.buyer[k] as string | null) = v))}
          />

          <Group title="Cession">
            <Field label="Date de cession" value={dossier.cession.date} onChange={(v) => upd((d) => (d.cession.date = v))} placeholder="JJ/MM/AAAA" />
            <Field label="Heure" value={dossier.cession.heure} onChange={(v) => upd((d) => (d.cession.heure = v))} placeholder="14" />
            <Field label="Minutes" value={dossier.cession.min} onChange={(v) => upd((d) => (d.cession.min = v))} placeholder="00" />
            <Field label="Fait à (vendeur)" value={dossier.cession.lieuFaitSeller} onChange={(v) => upd((d) => (d.cession.lieuFaitSeller = v))} />
            <Field label="Le (vendeur)" value={dossier.cession.dateFaitSeller} onChange={(v) => upd((d) => (d.cession.dateFaitSeller = v))} placeholder="JJ/MM/AAAA" />
            <Field label="Fait à (acheteur)" value={dossier.cession.lieuFaitBuyer} onChange={(v) => upd((d) => (d.cession.lieuFaitBuyer = v))} />
            <Field label="Le (acheteur)" value={dossier.cession.dateFaitBuyer} onChange={(v) => upd((d) => (d.cession.dateFaitBuyer = v))} placeholder="JJ/MM/AAAA" />
          </Group>

          <Group title="Transaction (livre de police)">
            <Field
              label={operation === "achat" ? "Date d'entrée au parc" : "Date de sortie"}
              value={dossier.cession.dateMouvement}
              onChange={(v) => upd((d) => (d.cession.dateMouvement = v))}
              placeholder="JJ/MM/AAAA"
            />
            <Field
              label={operation === "achat" ? "Prix d'achat (€)" : "Prix de vente TTC (€)"}
              value={dossier.cession.prix}
              onChange={(v) => upd((d) => (d.cession.prix = v))}
            />
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-400">Mode de paiement</span>
              <select
                value={dossier.cession.paiement ?? ""}
                onChange={(e) => upd((d) => (d.cession.paiement = e.target.value || null))}
                className="input"
              >
                <option value="">—</option>
                <option>Virement</option>
                <option>Chèque</option>
                <option>Carte bancaire</option>
                <option>Espèces</option>
              </select>
            </label>
            {operation === "vente" && (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-400">Destination (sortie)</span>
                <select
                  value={dossier.cession.sortieDestination ?? "vente"}
                  onChange={(e) =>
                    upd((d) => (d.cession.sortieDestination = e.target.value as typeof d.cession.sortieDestination))
                  }
                  className="input"
                >
                  <option value="vente">Vente</option>
                  <option value="depot_vente">Dépôt-vente (fin)</option>
                  <option value="restitution">Restitution</option>
                  <option value="destruction">Destruction</option>
                </select>
              </label>
            )}
            {dossier.cession.paiement === "Espèces" && (
              <p className="text-xs text-amber-300 sm:col-span-2 lg:col-span-3">
                ⚠️ Paiement en espèces limité à 1 000 € (et interdit entre professionnels).
              </p>
            )}
          </Group>

          <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={includePro}
                onChange={(e) => setIncludePro(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              Ajouter mes informations professionnelles sur les documents
            </label>
            {includePro && dossier.pro && (
              dossier.pro.name ? (
                <p className="mt-2 text-sm text-slate-300">
                  <strong className="text-slate-200">{dossier.pro.name}</strong>
                  {dossier.pro.siret && ` · SIRET ${dossier.pro.siret}`}
                  {(dossier.pro.nomVoie || dossier.pro.commune) &&
                    ` · ${[dossier.pro.noVoie, dossier.pro.typeVoie, dossier.pro.nomVoie].filter(Boolean).join(" ")} ${dossier.pro.cp ?? ""} ${dossier.pro.commune ?? ""}`}
                  {" — "}
                  <Link href="/compte" className="font-medium text-brand-400 hover:underline">modifier dans Mon espace</Link>
                </p>
              ) : (
                <p className="mt-2 text-sm text-amber-300">
                  Profil pro vide.{" "}
                  <Link href="/compte" className="font-medium text-brand-400 hover:underline">Renseigne-le dans Mon espace</Link>.
                </p>
              )
            )}
          </div>

          <h3 className="mt-6 mb-1 text-sm font-semibold text-slate-200">Documents</h3>
          <p className="mb-2 text-xs text-slate-400">Clique pour générer et afficher le PDF (il s'ajoute plus bas).</p>
          {documentsButtons}

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4">
            <button
              onClick={saveDossier}
              disabled={saving}
              className="btn-ghost disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : savedId ? "Enregistré ✓ — réenregistrer" : "Enregistrer le dossier"}
            </button>
            {lpInfo ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300">
                ✓ Inscrit au livre de police (n° {lpInfo.year}-{String(lpInfo.num).padStart(3, "0")})
              </span>
            ) : (
              <button
                onClick={pushToLivrePolice}
                disabled={pushing || saving}
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-50"
              >
                {pushing ? "Envoi…" : "📖 Envoyer au livre de police"}
              </button>
            )}
            {savedId && operation === "vente" && !linkTo && (
              <a
                href={`/?reprise=${savedId}`}
                className="rounded-xl bg-amber-500/100 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600"
              >
                + Ajouter la reprise
              </a>
            )}
            {savedId && (
              <Link href="/dossiers" className="text-sm font-medium text-brand-400 hover:underline">
                Voir mes dossiers →
              </Link>
            )}
          </div>

          {savedId ? (
            <DossierDocuments dossierId={savedId} />
          ) : (
            <p className="mt-5 border-t border-slate-800 pt-4 text-xs text-slate-400">
              Enregistre le dossier pour y joindre des pièces (permis, justificatif de domicile…).
            </p>
          )}
        </section>
      )}

      {/* Documents générés — empilés */}
      {docs.map((doc) => (
        <section key={doc.key} className="mt-6 card p-5 shadow-xl shadow-black/20">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{doc.label}</h2>
            <a href={doc.url} download={`${doc.key}.pdf`} className="text-sm font-medium text-brand-400 hover:underline">
              Télécharger
            </a>
          </div>
          <iframe src={doc.url} className="h-[80vh] w-full rounded-lg border border-slate-800 bg-white" />
        </section>
      ))}
      </main>
    </>
  );
}

function FileInput({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-4 transition ${
        file
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "scan-frame border-accent/40 bg-slate-950/40 hover:border-accent hover:bg-slate-900/60"
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
          file ? "bg-emerald-500/15 text-emerald-300" : "bg-cyan-400/10 text-accent"
        }`}
      >
        {file ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L8 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3l-1.5-2Z" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-100">{label}</span>
        <span className="block truncate text-xs text-slate-400">
          {file ? file.name : "Prendre une photo ou choisir un fichier"}
        </span>
      </span>
      {file && <span className="badge badge-vendu shrink-0">Détecté</span>}
      <input
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-sm font-semibold text-slate-200">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string | null | undefined; onChange: (v: string | null) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label">{label}</span>
      <input
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value || null)}
        className="input"
      />
    </label>
  );
}

function PersonGroup({ title, person, birth, idDoc, allowPro, onField }: { title: string; person: Person; birth?: boolean; idDoc?: boolean; allowPro?: boolean; onField: (k: keyof Person, v: string | null) => void }) {
  const isPro = person.kind === "morale";
  return (
    <Group title={title}>
      {allowPro && (
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-200 sm:col-span-2 lg:col-span-3">
          <input
            type="checkbox"
            checked={isPro}
            onChange={(e) => onField("kind", e.target.checked ? "morale" : "physique")}
            className="h-4 w-4 accent-brand-600"
          />
          Contrepartie professionnelle (société)
        </label>
      )}
      <Field label={isPro ? "Raison sociale" : "Nom et prénom"} value={person.name} onChange={(v) => onField("name", v)} />
      {isPro && <Field label="SIRET" value={person.siret} onChange={(v) => onField("siret", v)} />}
      {!isPro && birth && <Field label="Né(e) le" value={person.birthDate} onChange={(v) => onField("birthDate", v)} placeholder="JJ/MM/AAAA" />}
      {!isPro && birth && <Field label="À (lieu de naissance)" value={person.birthPlace} onChange={(v) => onField("birthPlace", v)} />}
      <Field label="N° de voie" value={person.noVoie} onChange={(v) => onField("noVoie", v)} />
      <Field label="Type de voie" value={person.typeVoie} onChange={(v) => onField("typeVoie", v)} placeholder="RUE, AVENUE…" />
      <Field label="Nom de voie" value={person.nomVoie} onChange={(v) => onField("nomVoie", v)} />
      <Field label="Code postal" value={person.cp} onChange={(v) => onField("cp", v)} />
      <Field label="Commune" value={person.commune} onChange={(v) => onField("commune", v)} />
      {!isPro && idDoc && <Field label="Pièce d'identité" value={person.idType} onChange={(v) => onField("idType", v)} placeholder="CNI, Passeport…" />}
      {!isPro && idDoc && <Field label="N° de la pièce" value={person.idNumber} onChange={(v) => onField("idNumber", v)} />}
      {!isPro && idDoc && <Field label="Autorité de délivrance" value={person.idAuthority} onChange={(v) => onField("idAuthority", v)} />}
      {!isPro && idDoc && <Field label="Délivrée le" value={person.idDate} onChange={(v) => onField("idDate", v)} placeholder="JJ/MM/AAAA" />}
    </Group>
  );
}

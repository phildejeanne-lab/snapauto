"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "dossier-docs";

const TYPES: { value: string; label: string }[] = [
  { value: "permis", label: "Permis de conduire" },
  { value: "justif_domicile", label: "Justificatif de domicile" },
  { value: "cni", label: "Pièce d'identité" },
  { value: "carte_grise", label: "Carte grise" },
  { value: "controle_technique", label: "Contrôle technique" },
  { value: "mandat", label: "Mandat" },
  { value: "certificat_cession", label: "Certificat de cession" },
  { value: "facture", label: "Facture" },
  { value: "quitus_fiscal", label: "Quitus fiscal (import)" },
  { value: "coc", label: "Certificat de conformité (COC)" },
  { value: "carte_grise_etrangere", label: "Carte grise étrangère" },
  { value: "autre", label: "Autre" },
];
const typeLabel = (v: string) => TYPES.find((t) => t.value === v)?.label ?? "Autre";

// Pièces d'identité : purge courte (minimisation RGPD). Le reste = dossier d'immat, 5 ans.
const SHORT_TYPES = new Set(["cni", "permis", "justif_domicile"]);
const defaultRetention = (t: string) => (SHORT_TYPES.has(t) ? "rgpd_2m" : "siv_5y");
const retentionMonths = (r: string) => (r === "siv_5y" ? 60 : 2);

type Doc = {
  id: string;
  type: string;
  filename: string;
  storage_path: string;
  mime: string | null;
  size: number | null;
  purge_after: string;
  created_at: string;
  sha256: string | null;
  retention: string | null;
};

type AuditRow = { id: string; action: string; filename: string | null; at: string };

const fmtSize = (n: number | null) => {
  if (!n) return "";
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1)} Mo`;
};
const fmtDate = (s: string) => new Date(s).toLocaleDateString("fr-FR");
const actionLabel = (a: string) =>
  a === "upload" ? "Ajout" : a === "view" ? "Consultation" : a === "delete" ? "Suppression" : a;

const safeName = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function DossierDocuments({ dossierId }: { dossierId: string }) {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [type, setType] = useState("justif_domicile");
  const [retention, setRetention] = useState(defaultRetention("justif_domicile"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; doc: Doc } | null>(null);
  const [journal, setJournal] = useState<AuditRow[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPreview(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  async function refresh() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("dossier_documents")
      .select("id, type, filename, storage_path, mime, size, purge_after, created_at, sha256, retention")
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setDocs((data ?? []) as Doc[]);
  }

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: m } = await supabase.from("memberships").select("org_id").limit(1).maybeSingle();
      setOrgId(m?.org_id ?? null);
      const { data: u } = await supabase.auth.getUser();
      setUserId(u.user?.id ?? null);
      await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  // Journal d'audit (append-only). Consigne ajout / consultation / suppression.
  async function logAudit(action: string, doc: { id?: string; filename?: string | null; sha256?: string | null }) {
    if (!orgId) return;
    const supabase = createClient();
    await supabase.from("document_audit").insert({
      org_id: orgId,
      dossier_id: dossierId,
      document_id: doc.id ?? null,
      filename: doc.filename ?? null,
      action,
      sha256: doc.sha256 ?? null,
      user_id: userId,
    });
    setJournal(null); // invalide le journal chargé
  }

  async function loadJournal() {
    if (journal) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("document_audit")
      .select("id, action, filename, at")
      .eq("dossier_id", dossierId)
      .order("at", { ascending: false });
    setJournal((data ?? []) as AuditRow[]);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const sha256 = await sha256Hex(file);
      const path = `${orgId}/${dossierId}/${crypto.randomUUID()}-${safeName(file.name)}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) throw upErr;
      const purge = new Date();
      purge.setMonth(purge.getMonth() + retentionMonths(retention));
      const { data: row, error: insErr } = await supabase
        .from("dossier_documents")
        .insert({
          org_id: orgId,
          dossier_id: dossierId,
          type,
          filename: file.name,
          storage_path: path,
          mime: file.type || null,
          size: file.size,
          sha256,
          retention,
          purge_after: purge.toISOString(),
        })
        .select("id, filename, sha256")
        .single();
      if (insErr) throw insErr;
      await logAudit("upload", row);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function open(doc: Doc) {
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storage_path, 300);
    if (error) setError(error.message);
    else if (data?.signedUrl) {
      setPreview({ url: data.signedUrl, doc });
      logAudit("view", doc);
    }
  }

  async function remove(doc: Doc) {
    if (!window.confirm(`Supprimer « ${doc.filename} » ?`)) return;
    setError(null);
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    const { error } = await supabase.from("dossier_documents").delete().eq("id", doc.id);
    if (error) setError(error.message);
    else {
      await logAudit("delete", doc);
      setDocs((ds) => ds?.filter((d) => d.id !== doc.id) ?? null);
    }
  }

  return (
    <div className="mt-5 border-t border-slate-800 pt-4">
      <h3 className="mb-1 text-sm font-semibold text-slate-200">Pièces du dossier</h3>
      <p className="mb-3 text-xs text-slate-400">
        Archivage sécurisé : chaque pièce est scellée (empreinte SHA-256), horodatée et tracée.
        Les pièces d'identité sont effacées ~2 mois (RGPD) ; les pièces du dossier d'immatriculation
        sont conservées 5 ans.
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setRetention(defaultRetention(e.target.value));
          }}
          className="rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-100 outline-none focus:border-accent"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={retention}
          onChange={(e) => setRetention(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-100 outline-none focus:border-accent"
          title="Durée de conservation"
        >
          <option value="siv_5y">Conserver 5 ans</option>
          <option value="rgpd_2m">Effacer à 2 mois</option>
        </select>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={onFile}
          disabled={busy}
          className="hidden"
          id="dossier-doc-input"
        />
        <label
          htmlFor="dossier-doc-input"
          className={`cursor-pointer rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-900/40 ${
            busy ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {busy ? "Scellement…" : "+ Ajouter une pièce"}
        </label>
      </div>

      {error && <p className="mb-2 text-sm text-red-300">{error}</p>}

      {docs && docs.length === 0 && <p className="text-sm text-slate-400">Aucune pièce jointe.</p>}

      {docs && docs.length > 0 && (
        <ul className="flex flex-col gap-2">
          {docs.map((d) => (
            <li key={d.id} className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="shrink-0 rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">
                  {typeLabel(d.type)}
                </span>
                <button
                  onClick={() => open(d)}
                  className="min-w-0 flex-1 truncate text-left text-sm text-brand-400 hover:underline"
                  title={d.filename}
                >
                  {d.filename}
                </button>
                <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">{fmtSize(d.size)}</span>
                <button
                  onClick={() => remove(d)}
                  aria-label="Supprimer"
                  title="Supprimer"
                  className="shrink-0 rounded-lg border border-slate-800 px-2.5 py-1 text-sm text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-0.5 text-[11px] text-slate-500">
                <span
                  className={`rounded px-1.5 py-0.5 font-medium ${
                    (d.retention ?? defaultRetention(d.type)) === "siv_5y"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {(d.retention ?? defaultRetention(d.type)) === "siv_5y" ? "Conservé 5 ans" : "Effacé ~2 mois"}
                </span>
                <span>archivé le {fmtDate(d.created_at)}</span>
                {d.sha256 && (
                  <span className="font-mono text-slate-500" title={`Empreinte SHA-256 : ${d.sha256}`}>
                    🔒 scellé {d.sha256.slice(0, 10)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Journal de traçabilité */}
      <details className="mt-3 text-xs" onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && loadJournal()}>
        <summary className="cursor-pointer text-slate-400 hover:text-slate-200">Journal d'archivage (traçabilité)</summary>
        <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/40 p-2">
          {!journal ? (
            <p className="text-slate-500">Chargement…</p>
          ) : journal.length === 0 ? (
            <p className="text-slate-500">Aucune opération enregistrée.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {journal.map((j) => (
                <li key={j.id} className="flex justify-between gap-3 text-slate-400">
                  <span>
                    <span className="font-medium text-slate-300">{actionLabel(j.action)}</span>
                    {j.filename ? ` — ${j.filename}` : ""}
                  </span>
                  <span className="shrink-0 text-slate-500">{new Date(j.at).toLocaleString("fr-FR")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-0 backdrop-blur-sm sm:p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-slate-900 sm:h-[88vh] sm:rounded-2xl sm:border sm:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/80 px-4 py-3">
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100" title={preview.doc.filename}>
                {preview.doc.filename}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
                >
                  Ouvrir / Télécharger
                </a>
                <button
                  onClick={() => setPreview(null)}
                  aria-label="Fermer"
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-950/40 p-3">
              {preview.doc.mime?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt={preview.doc.filename} className="mx-auto max-h-full max-w-full rounded-lg object-contain" />
              ) : (
                <iframe src={preview.url} title={preview.doc.filename} className="h-full w-full rounded-lg bg-white" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

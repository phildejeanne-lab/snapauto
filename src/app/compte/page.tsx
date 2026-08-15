"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/AppHeader";

type Org = {
  id: string;
  name: string | null;
  siren: string | null;
  agrement: string | null;
  address_line: string | null;
  postal_code: string | null;
  city: string | null;
};

export default function ComptePage() {
  const [org, setOrg] = useState<Org | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "saved" | "error">("loading");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: m, error: mErr } = await supabase
        .from("memberships")
        .select("org_id")
        .limit(1)
        .maybeSingle();
      if (mErr || !m?.org_id) {
        setStatus("error");
        setMsg(mErr?.message ?? "Aucune organisation trouvée.");
        return;
      }
      const { data: org, error } = await supabase
        .from("organizations")
        .select("id, name, siren, agrement, address_line, postal_code, city")
        .eq("id", m.org_id)
        .maybeSingle();
      if (error) {
        setStatus("error");
        setMsg(error.message);
        return;
      }
      setOrg((org ?? null) as Org | null);
      setStatus("idle");
    })();
  }, []);

  function set<K extends keyof Org>(k: K, v: Org[K]) {
    setOrg((o) => (o ? { ...o, [k]: v } : o));
  }

  async function save() {
    if (!org) return;
    setStatus("saving");
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("organizations")
      .update({
        name: org.name,
        siren: org.siren,
        agrement: org.agrement,
        address_line: org.address_line,
        postal_code: org.postal_code,
        city: org.city,
      })
      .eq("id", org.id);
    if (error) {
      setStatus("error");
      setMsg(error.message);
    } else {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-slate-100">Mon espace professionnel</h1>
      <p className="mb-6 text-sm text-slate-400">Vos informations, saisies une fois, pré-remplies sur vos documents.</p>

      {status === "loading" && <p className="text-sm text-slate-400">Chargement…</p>}
      {status === "error" && !org && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{msg}</p>
      )}

      {org && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Raison sociale" value={org.name} onChange={(v) => set("name", v)} />
            <F label="SIRET / SIREN" value={org.siren} onChange={(v) => set("siren", v)} />
            <F label="N° d'agrément (le cas échéant)" value={org.agrement} onChange={(v) => set("agrement", v)} />
            <F label="Adresse (n° + voie)" value={org.address_line} onChange={(v) => set("address_line", v)} />
            <F label="Code postal" value={org.postal_code} onChange={(v) => set("postal_code", v)} />
            <F label="Commune" value={org.city} onChange={(v) => set("city", v)} />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={save}
              disabled={status === "saving"}
              className="rounded-xl bg-brand-600 px-5 py-2.5 font-medium text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-50"
            >
              {status === "saving" ? "Enregistrement…" : "Enregistrer"}
            </button>
            {status === "saved" && <span className="text-sm font-medium text-emerald-300">Enregistré ✓</span>}
            {status === "error" && <span className="text-sm text-red-300">{msg}</span>}
          </div>
        </div>
      )}
      </main>
    </>
  );
}

function F({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="input"
      />
    </label>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/AppHeader";

type Contact = {
  id: string;
  name: string | null;
  kind: string | null;
  birth_date: string | null;
  cp: string | null;
  commune: string | null;
  siren: string | null;
  data: { noVoie?: string; typeVoie?: string; nomVoie?: string; birthPlace?: string } | null;
};
type Dossier = {
  id: string;
  label: string | null;
  operation: "achat" | "vente" | null;
  immat: string | null;
  created_at: string;
};

export default function ClientDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [contact, setContact] = useState<Contact | null>(null);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: c, error: cErr } = await supabase
        .from("contacts")
        .select("id, name, kind, birth_date, cp, commune, siren, data")
        .eq("id", id)
        .maybeSingle();
      if (cErr) setError(cErr.message);
      else setContact(c as Contact | null);
      const { data: d } = await supabase
        .from("dossiers")
        .select("id, label, operation, immat, created_at")
        .eq("contact_id", id)
        .order("created_at", { ascending: false });
      setDossiers((d ?? []) as Dossier[]);
      setLoading(false);
    })();
  }, [id]);

  const addr = contact?.data;
  const street = [addr?.noVoie, addr?.typeVoie, addr?.nomVoie].filter(Boolean).join(" ");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-5">
        <Link href="/clients" className="text-sm font-medium text-brand-600 hover:underline">← Clients</Link>

        {loading && <p className="mt-4 text-sm text-slate-500">Chargement…</p>}
        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {contact && (
          <>
            <div className="mt-3 mb-6 flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-700">
                {(contact.name ?? "?").trim().charAt(0).toUpperCase()}
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{contact.name || "Sans nom"}</h1>
                <p className="text-sm text-slate-500">
                  {contact.kind === "morale" ? "Personne morale" : "Particulier"}
                  {contact.siren && ` · SIREN ${contact.siren}`}
                </p>
              </div>
            </div>

            <div className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
              <Info label="Né(e) le" value={contact.birth_date} />
              <Info label="Lieu de naissance" value={addr?.birthPlace ?? null} />
              <Info label="Adresse" value={street || null} />
              <Info label="Ville" value={[contact.cp, contact.commune].filter(Boolean).join(" ") || null} />
            </div>

            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Historique ({dossiers.length})
            </h2>
            <ul className="flex flex-col gap-2">
              {dossiers.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/?dossier=${d.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-300 hover:shadow-sm"
                  >
                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${
                        d.operation === "achat" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {d.operation === "achat" ? "Achat" : "Vente"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{d.label || "Dossier"}</p>
                      <p className="truncate text-xs text-slate-500">
                        {d.immat ?? "—"} · {new Date(d.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
              {dossiers.length === 0 && <li className="text-sm text-slate-500">Aucun dossier.</li>}
            </ul>
          </>
        )}
      </main>
    </>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm text-slate-800">{value || "—"}</p>
    </div>
  );
}

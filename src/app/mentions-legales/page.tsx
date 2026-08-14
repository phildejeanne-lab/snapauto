import Link from "next/link";
import type { Metadata } from "next";
import { Brand } from "@/components/Logo";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Mentions légales — SnapAuto",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-sm text-slate-600">
      <span className="font-medium text-slate-800">{label} : </span>
      {children}
    </p>
  );
}

const EDITEUR = {
  nom: "Philippe COLLIN",
  forme: "Entrepreneur individuel (micro-entreprise)",
  nomCommercial: "SnapAuto",
  siren: "104 635 560",
  siret: "10463556000014",
  registre: "Registre National des Entreprises (RNE)",
  tva: "TVA non applicable, article 293 B du CGI (franchise en base)",
  siege: "2 route d'Ugny, 54870 Cons-la-Grandville, France",
  email: "contact@snapauto.fr",
  directeur: "Philippe Collin",
};

export default function MentionsLegalesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200/70 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="transition hover:opacity-80">
            <Brand size={28} />
          </Link>
          <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-800">
            ← Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mentions légales</h1>
        <p className="mt-2 text-sm text-slate-500">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </p>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Éditeur du site</h2>
          <Field label="Éditeur">{EDITEUR.nom} — {EDITEUR.forme}</Field>
          <Field label="Nom commercial">{EDITEUR.nomCommercial}</Field>
          <Field label="SIREN">{EDITEUR.siren}</Field>
          <Field label="SIRET">{EDITEUR.siret}</Field>
          <Field label="Immatriculation">{EDITEUR.registre}</Field>
          <Field label="TVA">{EDITEUR.tva}</Field>
          <Field label="Siège social">{EDITEUR.siege}</Field>
          <Field label="Contact">{EDITEUR.email}</Field>
          <Field label="Directeur de la publication">{EDITEUR.directeur}</Field>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Hébergement</h2>
          <Field label="Application">
            Vercel Inc. — 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis — vercel.com
          </Field>
          <Field label="Base de données">
            Supabase (hébergement dans l'Union européenne) — supabase.com
          </Field>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Propriété intellectuelle</h2>
          <p className="text-sm text-slate-600">
            L'ensemble des éléments du site (marque, logo, textes, interface) est protégé par le
            droit de la propriété intellectuelle. Toute reproduction sans autorisation est
            interdite.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Données personnelles</h2>
          <p className="text-sm text-slate-600">
            Le traitement des données personnelles est détaillé dans notre{" "}
            <Link href="/confidentialite" className="font-medium text-brand-600 hover:underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

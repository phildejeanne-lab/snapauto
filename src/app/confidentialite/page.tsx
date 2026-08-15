import Link from "next/link";
import type { Metadata } from "next";
import { Brand } from "@/components/Logo";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Politique de confidentialité — SnapAuto",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

const CONTACT = "contact@snapauto.fr";

export default function ConfidentialitePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-800/70 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="transition hover:opacity-80">
            <Brand size={28} />
          </Link>
          <Link href="/" className="text-sm text-slate-400 transition hover:text-slate-200">
            ← Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          Politique de confidentialité
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </p>

        <Section title="1. Qui fait quoi ?">
          <p>
            SnapAuto est un outil destiné aux professionnels de l'automobile pour établir les
            documents de cession de véhicules d'occasion (Cerfa) à partir de photos de documents,
            et tenir le livre de police.
          </p>
          <p>
            <span className="font-medium text-slate-200">Le professionnel utilisateur</span>{" "}
            (garage, négociant, mandataire) est <span className="font-medium">responsable de
            traitement</span> des données de ses clients qu'il saisit dans l'outil.
          </p>
          <p>
            <span className="font-medium text-slate-200">SnapAuto</span> agit en qualité de{" "}
            <span className="font-medium">sous-traitant</span> : il traite ces données uniquement
            pour fournir le service, conformément aux instructions du professionnel.
          </p>
        </Section>

        <Section title="2. Données traitées">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-slate-200">Compte professionnel</span> : email,
              informations de l'entreprise (raison sociale, adresse, SIREN…).
            </li>
            <li>
              <span className="font-medium text-slate-200">Données de dossier</span> : informations
              du véhicule (immatriculation, VIN, caractéristiques) et des parties (nom, adresse,
              pièce d'identité), extraites des documents photographiés.
            </li>
            <li>
              <span className="font-medium text-slate-200">Transaction</span> : prix, mode de
              paiement, date.
            </li>
            <li>
              <span className="font-medium text-slate-200">Pièces jointes au dossier</span> :
              documents que le professionnel choisit d'archiver (permis, justificatif de domicile,
              mandat…), stockés de façon sécurisée et cloisonnée par organisation.
            </li>
          </ul>
          <p className="rounded-lg bg-slate-900/40 px-3 py-2">
            📷 <span className="font-medium text-slate-200">Les photos d'analyse ne sont pas
            conservées.</span>{" "}
            La carte grise et la pièce d'identité photographiées pour le pré-remplissage sont
            analysées puis écartées ; seules les données extraites sont enregistrées. Les pièces que
            le professionnel <em>joint volontairement</em> au dossier sont, elles, conservées (voir
            durées ci-dessous).
          </p>
        </Section>

        <Section title="3. Finalités et base légale">
          <ul className="list-disc space-y-1 pl-5">
            <li>Générer les documents de cession (Cerfa) — exécution du service.</li>
            <li>
              Tenir le livre de police — <span className="font-medium">obligation légale</span>{" "}
              (registre des véhicules d'occasion).
            </li>
            <li>Gérer les comptes et sécuriser l'accès — intérêt légitime.</li>
          </ul>
        </Section>

        <Section title="4. Destinataires et sous-traitants">
          <p>Pour fonctionner, le service s'appuie sur des prestataires techniques :</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-slate-200">Anthropic</span> — analyse des documents
              (extraction des informations depuis les photos). Les images ne sont pas utilisées
              pour entraîner de modèles.
            </li>
            <li>
              <span className="font-medium text-slate-200">Supabase</span> — hébergement de la base
              de données (Union européenne) et authentification.
            </li>
            <li>
              <span className="font-medium text-slate-200">Vercel</span> — hébergement de
              l'application.
            </li>
          </ul>
          <p>Aucune donnée n'est vendue ni cédée à des tiers à des fins commerciales.</p>
        </Section>

        <Section title="5. Durée de conservation">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-slate-200">Livre de police</span> : conservé
              conformément à l'obligation légale applicable aux registres de véhicules d'occasion.
            </li>
            <li>
              <span className="font-medium text-slate-200">Dossiers</span> : conservés le temps
              nécessaire à l'opération et aux obligations comptables. Un dossier peut être supprimé
              par le professionnel à tout moment ; l'inscription minimale au livre de police est
              alors conservée pour répondre à l'obligation légale.
            </li>
            <li>
              <span className="font-medium text-slate-200">Pièces jointes au dossier</span>{" "}
              (permis, justificatif de domicile…) : conservées le temps de l'établissement de la
              carte grise, puis <span className="font-medium">effacées automatiquement environ
              2 mois après l'opération</span>. Elles peuvent aussi être supprimées manuellement à
              tout moment.
            </li>
            <li>
              <span className="font-medium text-slate-200">Compte</span> : conservé tant que le
              compte est actif.
            </li>
          </ul>
        </Section>

        <Section title="6. Vos droits">
          <p>
            Conformément au RGPD, les personnes concernées disposent d'un droit d'accès, de
            rectification, d'effacement, de limitation et d'opposition. Ces droits s'exercent
            auprès du professionnel responsable de traitement (le garage), ou via SnapAuto qui
            relaiera la demande.
          </p>
          <p>
            Contact : <span className="font-medium text-slate-200">{CONTACT}</span>. En cas de
            désaccord, un recours peut être formé auprès de la CNIL (cnil.fr).
          </p>
        </Section>

        <Section title="7. Sécurité">
          <p>
            Les données sont chiffrées au repos et en transit, hébergées dans l'Union européenne, et
            l'accès est cloisonné par organisation. Le livre de police est inscrit en mode
            inaltérable (ni modification ni suppression possibles).
          </p>
        </Section>
      </main>

      <Footer />
    </div>
  );
}

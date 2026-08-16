import Link from "next/link";
import type { Metadata } from "next";
import { Brand } from "@/components/Logo";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — SnapAuto",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

const PRESTATAIRE = {
  nom: "Philippe COLLIN",
  forme: "Entrepreneur individuel (micro-entreprise)",
  siren: "104 635 560",
  siege: "2 route d'Ugny, 54870 Cons-la-Grandville, France",
  email: "contact@snapauto.fr",
};

const OFFRES = [
  { nom: "Démarrage / Indépendant", prix: "29 € HT / mois", detail: "jusqu'à 15 véhicules par mois" },
  { nom: "Pro / Négociant", prix: "39 € HT / mois", detail: "véhicules illimités" },
];

export default function CgvPage() {
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
          Conditions Générales de Vente
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </p>

        <Section title="1. Objet">
          <p>
            Les présentes conditions générales de vente (les « CGV ») régissent la souscription et
            l'utilisation du service <span className="font-medium text-slate-200">SnapAuto</span>,
            application en ligne (SaaS) permettant aux professionnels de l'automobile de générer des
            documents de cession de véhicules d'occasion (Cerfa), de tenir un livre de police
            numérique et de gérer les pièces associées.
          </p>
          <p>
            Toute souscription implique l'acceptation sans réserve des présentes CGV.
          </p>
        </Section>

        <Section title="2. Prestataire">
          <p>
            Le service est édité par <span className="font-medium text-slate-200">{PRESTATAIRE.nom}</span>,
            {" "}{PRESTATAIRE.forme}, SIREN {PRESTATAIRE.siren}, dont le siège est situé{" "}
            {PRESTATAIRE.siege}. Contact : {PRESTATAIRE.email}.
          </p>
        </Section>

        <Section title="3. Clientèle — service réservé aux professionnels">
          <p>
            SnapAuto est exclusivement destiné à des{" "}
            <span className="font-medium text-slate-200">clients professionnels</span> (marchands de
            véhicules d'occasion, négociants, mandataires, garagistes) agissant dans le cadre de leur
            activité. Le client déclare disposer de la capacité et des autorisations nécessaires à
            l'exercice de cette activité.
          </p>
        </Section>

        <Section title="4. Description du service">
          <p>Le service comprend, selon la formule souscrite :</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>l'extraction automatisée des données depuis les photos de documents (OCR) ;</li>
            <li>la génération des documents de cession (Cerfa) ;</li>
            <li>la tenue d'un livre de police numérique, numéroté, horodaté et non modifiable ;</li>
            <li>le stockage sécurisé des pièces jointes au dossier.</li>
          </ul>
          <p>
            SnapAuto est un <span className="font-medium text-slate-200">outil d'assistance</span> :
            les données extraites automatiquement sont fournies à titre indicatif et doivent être
            vérifiées par le client avant tout usage (voir article 9).
          </p>
        </Section>

        <Section title="5. Compte et accès">
          <p>
            L'accès s'effectue par lien de connexion sécurisé envoyé par e-mail, sans mot de passe.
            Le client est responsable de la confidentialité de sa boîte e-mail et des accès à son
            compte. Le service est accessible via un navigateur web (ordinateur, smartphone,
            tablette) et ne nécessite aucune installation.
          </p>
        </Section>

        <Section title="6. Tarifs">
          <ul className="list-disc space-y-1 pl-5">
            {OFFRES.map((o) => (
              <li key={o.nom}>
                <span className="font-medium text-slate-200">{o.nom}</span> : {o.prix} ({o.detail}).
              </li>
            ))}
          </ul>
          <p>
            Un paiement annuel donne droit à deux mois offerts. Les tarifs applicables sont ceux
            affichés sur le site au moment de la souscription.{" "}
            <span className="font-medium text-slate-200">TVA non applicable, article 293 B du CGI</span>
            {" "}(franchise en base).
          </p>
          <p>
            Le prestataire se réserve le droit de modifier ses tarifs ; toute évolution sera notifiée
            au client et s'appliquera à l'échéance d'abonnement suivante.
          </p>
        </Section>

        <Section title="7. Paiement, durée et résiliation">
          <p>
            L'abonnement est souscrit pour une durée mensuelle ou annuelle, renouvelée par tacite
            reconduction, <span className="font-medium text-slate-200">sans engagement de durée</span>.
            Le paiement est exigible d'avance par les moyens proposés sur le site.
          </p>
          <p>
            Le client peut résilier à tout moment depuis son espace ou par e-mail ; la résiliation
            prend effet à la fin de la période en cours, sans remboursement de la période entamée.
            En cas de défaut de paiement, l'accès au service peut être suspendu.
          </p>
        </Section>

        <Section title="8. Droit de rétractation">
          <p>
            Le service étant fourni à des professionnels dans le cadre de leur activité, le droit de
            rétractation prévu pour les consommateurs ne s'applique pas. Le client peut néanmoins
            tester le service via l'essai gratuit proposé avant toute souscription payante.
          </p>
        </Section>

        <Section title="9. Obligations et responsabilité du client">
          <p>
            Le client demeure seul responsable de l'exactitude des informations, de la vérification
            des documents générés, du respect de ses obligations légales (notamment la tenue du
            registre et les déclarations administratives) et de l'usage licite du service. Il
            s'engage à ne fournir que des documents qu'il est autorisé à traiter.
          </p>
        </Section>

        <Section title="10. Responsabilité du prestataire">
          <p>
            Le prestataire est tenu à une obligation de moyens. Sa responsabilité ne saurait être
            engagée en cas d'erreur dans les données extraites automatiquement, d'usage non conforme,
            ou de manquement du client à ses propres obligations. En tout état de cause, la
            responsabilité du prestataire est limitée au montant des sommes versées par le client au
            cours des douze derniers mois.
          </p>
        </Section>

        <Section title="11. Disponibilité">
          <p>
            Le prestataire s'efforce d'assurer la disponibilité du service 24h/24, sous réserve des
            opérations de maintenance et des cas de force majeure. Il ne saurait être tenu
            responsable des interruptions liées à l'hébergeur, au réseau ou à des prestataires
            tiers.
          </p>
        </Section>

        <Section title="12. Données personnelles">
          <p>
            Le traitement des données personnelles est décrit dans la{" "}
            <Link href="/confidentialite" className="font-medium text-brand-400 hover:underline">
              politique de confidentialité
            </Link>
            . Dans ce cadre, le prestataire agit en qualité de sous-traitant du client, lequel est
            responsable de traitement des données de ses propres clients.
          </p>
        </Section>

        <Section title="13. Propriété intellectuelle">
          <p>
            SnapAuto, sa marque, son logo, son interface et son code demeurent la propriété
            exclusive du prestataire. La souscription confère un simple droit d'usage personnel, non
            exclusif et non cessible, pour la durée de l'abonnement.
          </p>
        </Section>

        <Section title="14. Droit applicable et litiges">
          <p>
            Les présentes CGV sont soumises au droit français. En cas de litige, les parties
            s'efforceront de trouver une solution amiable avant toute action. À défaut, le litige
            sera porté devant les tribunaux compétents.
          </p>
        </Section>
      </main>

      <Footer />
    </div>
  );
}

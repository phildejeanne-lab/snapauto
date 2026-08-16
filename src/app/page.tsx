import Link from "next/link";
import type { Metadata } from "next";
import { Brand } from "@/components/Logo";

export const metadata: Metadata = {
  title: "SnapAuto, La paperasse VO simplifiée. Un snap, vos Cerfa sont prêts.",
  description:
    "Passez de la carte grise au pack de vente complet en 30 secondes. OCR intelligent, génération Cerfa instantanée et Livre de Police numérique pour marchands auto et garagistes.",
};

/* ---------- Icônes (style Lucide, inline) ---------- */
const ico = {
  scan: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M8 12h8",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
  lock: "M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1ZM8 11V7a4 4 0 0 1 8 0v4",
  bolt: "m13 2-9 12h7l-1 8 9-12h-7z",
  check: "M20 6 9 17l-5-5",
  car: "M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13M4 17a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1",
  play: "M6 4l14 8-14 8z",
};
function Ic({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300">
      <Ic d={ico.check} className="h-3.5 w-3.5 text-emerald-400" />
      {children}
    </span>
  );
}

export default function Landing() {
  return (
    <div>
      {/* ---------- HEADER ---------- */}
      <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/"><Brand size={30} /></Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">Fonctionnalités</a>
            <a href="#registre" className="transition hover:text-white">Livre de police</a>
            <a href="#tarifs" className="transition hover:text-white">Tarifs</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:block">
              Se connecter
            </Link>
            <Link href="/login" className="btn-cyan px-4 py-2 text-sm">Essai gratuit</Link>
          </div>
        </div>
      </header>

      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
              Pour marchands VO & garagistes indépendants
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
              La paperasse VO simplifiée.{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-brand-400 bg-clip-text text-transparent">
                Un snap, et vos Cerfa sont prêts.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              Passez de la carte grise au pack de vente complet en 30 secondes. OCR intelligent,
              génération Cerfa instantanée et Livre de Police numérique pour marchands auto.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="btn-cyan">Démarrer l'essai gratuit (sans CB)</Link>
              <a href="#features" className="btn-ghost">
                <Ic d={ico.play} className="h-4 w-4" /> Voir la démo 1 min
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              <Badge>Conforme art. 321-7 Code pénal</Badge>
              <Badge>100 % conforme RGPD</Badge>
              <Badge>Zéro saisie manuelle</Badge>
            </div>
          </div>

          {/* Hero graphic : scan carte grise -> Cerfa */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 -z-10 rounded-full bg-brand-500/10 blur-3xl" />
            <div className="grid grid-cols-2 gap-4">
              {/* Carte grise scannée */}
              <div className="scan-frame relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-slate-900/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">Carte grise</p>
                <div className="mt-3 space-y-2">
                  <div className="h-2 w-3/4 rounded bg-slate-700" />
                  <div className="h-2 w-1/2 rounded bg-slate-700" />
                  <div className="mt-3 h-2 w-full rounded bg-slate-800" />
                  <div className="h-2 w-5/6 rounded bg-slate-800" />
                  <div className="h-2 w-2/3 rounded bg-slate-800" />
                </div>
                <div className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-2">
                  <p className="font-mono text-[10px] text-cyan-300">VIN · ZFA3120000J</p>
                  <p className="font-mono text-[10px] text-cyan-300">GF-065-EZ · FIAT</p>
                </div>
              </div>
              {/* Cerfa généré */}
              <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900/70 p-4">
                <div className="flex items-center gap-1.5">
                  <Ic d={ico.check} className="h-3.5 w-3.5 text-emerald-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Cerfa 15776</p>
                </div>
                <div className="mt-3 space-y-2">
                  {["w-full", "w-11/12", "w-4/5", "w-full", "w-3/4", "w-5/6", "w-2/3"].map((w, i) => (
                    <div key={i} className={`h-2 rounded bg-slate-700 ${w}`} />
                  ))}
                </div>
                <div className="mt-3 inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                  Prêt à imprimer
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-300">
              <Ic d={ico.bolt} className="h-4 w-4 text-cyan-400" />
              Extraction & génération en <span className="font-bold text-white">3 secondes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- AVANT / APRÈS ---------- */}
      <section className="border-y border-slate-800/70 bg-slate-950/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            Fini la corvée administrative
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-400">
            Ce qui vous prenait 15 minutes par véhicule se fait maintenant en un instant.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6">
              <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-red-300">❌ Avant</p>
              <ul className="space-y-3 text-sm text-slate-300">
                <li>15 min à retaper le VIN à 17 caractères, à la main</li>
                <li>Erreurs de saisie qui bloquent le SIV</li>
                <li>Permis & CNI éparpillés sur WhatsApp</li>
                <li>Registre papier raturé, illisible en cas de contrôle</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-6">
              <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">✅ Avec SnapAuto</p>
              <ul className="space-y-3 text-sm text-slate-200">
                <li>Photo de la carte grise → OCR IA en 3 secondes</li>
                <li>Cerfa & facture prêts, sans une seule faute</li>
                <li>Coffre-fort numérique pour les pièces client</li>
                <li>Livre de police mis à jour automatiquement</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FONCTIONNALITÉS (Bento) ---------- */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            Tout le dossier de vente, automatisé
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Feature icon={ico.scan} title="OCR carte grise instantané" wide
              text="Extraction sans erreur du VIN, de l'immatriculation, marque, modèle et puissance. Vous vérifiez, vous validez, c'est tout." />
            <Feature icon={ico.file} title="Pack vente auto-généré"
              text="Cerfa 15776 (cession), 13751 (déclaration d'achat), mandat et facture édités automatiquement." />
            <Feature icon={ico.car} id="registre" title="Livre de police numérique"
              text="Registre infalsifiable, numéroté et horodaté, conforme à l'art. 321-7 du Code pénal. Export PDF pour les contrôles." />
            <Feature icon={ico.lock} title="Coffre-fort documents"
              text="CNI, permis, justificatifs capturés en sécurité, cloisonnés par compte, effacés automatiquement (RGPD)." wide />
          </div>
        </div>
      </section>

      {/* ---------- TARIFS ---------- */}
      <section id="tarifs" className="scroll-mt-20 border-y border-slate-800/70 bg-slate-950/40">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">Un tarif simple, sans engagement</h2>
          <p className="mt-3 text-center text-slate-400">2 mois offerts pour tout paiement annuel.</p>
          <div className="mt-10 grid items-start gap-5 md:grid-cols-2">
            {/* Démarrage */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-7 transition hover:-translate-y-1 hover:border-slate-700">
              <p className="text-sm font-semibold text-slate-300">Démarrage / Indépendant</p>
              <p className="mt-3"><span className="text-4xl font-extrabold text-white">29 €</span><span className="text-slate-400"> HT / mois</span></p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                {["Jusqu'à 15 VO / mois", "Scan OCR illimité", "Pack Cerfa PDF", "Support email"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Ic d={ico.check} className="h-4 w-4 text-emerald-400" />{f}</li>
                ))}
              </ul>
              <Link href="/login" className="btn-ghost mt-7 w-full">Commencer</Link>
            </div>
            {/* Pro */}
            <div className="relative rounded-2xl border border-cyan-400/40 bg-slate-900/70 p-7 shadow-xl shadow-cyan-500/10 transition hover:-translate-y-1">
              <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-cyan-400 to-brand-500 px-3 py-1 text-xs font-bold text-slate-950">POPULAIRE</span>
              <p className="text-sm font-semibold text-cyan-300">Pro / Négociant</p>
              <p className="mt-3"><span className="text-4xl font-extrabold text-white">39 €</span><span className="text-slate-400"> HT / mois</span></p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                {["VO illimités", "OCR illimité", "Livre de police numérique conforme", "Coffre-fort RGPD", "Export PDF / Excel", "Support prioritaire"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Ic d={ico.check} className="h-4 w-4 text-cyan-400" />{f}</li>
                ))}
              </ul>
              <Link href="/login" className="btn-cyan mt-7 w-full">Démarrer l'essai gratuit</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">Questions fréquentes</h2>
          <div className="mt-8 space-y-3">
            <Faq q="Le livre de police est-il légal en cas de contrôle ?"
              a="Oui. Le registre est numéroté, horodaté et non modifiable (une erreur s'annule, elle ne se supprime jamais), conformément aux exigences de l'art. 321-7 du Code pénal. Il s'exporte en PDF pour être présenté lors d'un contrôle." />
            <Faq q="Combien de temps prend l'installation ?"
              a="Aucune installation. SnapAuto est une application web accessible sur ordinateur, iPhone et Android, vous vous connectez en un clic, sans rien à télécharger." />
            <Faq q="Puis-je résilier à tout moment ?"
              a="Oui, l'abonnement est sans aucun engagement. Vous arrêtez quand vous voulez." />
            <Faq q="Mes données et celles de mes clients sont-elles protégées ?"
              a="Oui. Les données sont chiffrées et hébergées dans l'Union européenne, cloisonnées par compte. Les photos servant à l'analyse ne sont pas conservées, et les pièces jointes sont effacées automatiquement (RGPD)." />
          </div>
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-brand-600/20 to-cyan-400/10 p-8 text-center sm:p-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Prêt à ranger la paperasse ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Essayez SnapAuto gratuitement, sans carte bancaire. Votre premier Cerfa en moins de 2 minutes.
          </p>
          <Link href="/login" className="btn-cyan mx-auto mt-7 w-full sm:w-auto">Démarrer l'essai gratuit</Link>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-slate-800/70 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <Brand size={26} />
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-400">
            <Link href="/mentions-legales" className="transition hover:text-slate-200">Mentions légales</Link>
            <Link href="/confidentialite" className="transition hover:text-slate-200">Confidentialité (RGPD)</Link>
            <Link href="/cgv" className="transition hover:text-slate-200">CGV</Link>
            <Link href="/login" className="transition hover:text-slate-200">Se connecter</Link>
          </div>
        </div>
        <div className="mx-auto mt-6 flex max-w-6xl flex-wrap items-center justify-center gap-2 text-xs text-slate-500 sm:justify-start">
          <span className="rounded-full border border-slate-800 px-2.5 py-1">🔒 Paiement sécurisé Stripe</span>
          <span className="rounded-full border border-slate-800 px-2.5 py-1">🇪🇺 Données hébergées en Europe</span>
          <span className="text-slate-600">© {new Date().getFullYear()} SnapAuto</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, text, wide, id }: { icon: string; title: string; text: string; wide?: boolean; id?: string }) {
  return (
    <div id={id} className={`group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-slate-900/80 ${wide ? "md:col-span-2" : ""} ${id ? "scroll-mt-20" : ""}`}>
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-brand-500/20 text-accent transition group-hover:from-cyan-400/30 group-hover:to-brand-500/30">
        <Ic d={icon} className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-4 transition hover:border-slate-700 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-slate-100">
        {q}
        <span className="shrink-0 text-slate-500 transition group-open:rotate-45">＋</span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{a}</p>
    </details>
  );
}

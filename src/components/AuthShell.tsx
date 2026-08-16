import Link from "next/link";
import { Logo } from "./Logo";

// Cadre commun aux écrans d'authentification (connexion, inscription, mot de passe).
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex flex-col items-center text-center">
          <Logo size={56} className="mb-3" />
          <span className="font-display text-2xl font-extrabold tracking-tight text-white">
            Snap<span className="bg-gradient-to-r from-cyan-400 to-brand-400 bg-clip-text text-transparent">Auto</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
          <h1 className="mb-1 text-lg font-semibold text-slate-100">{title}</h1>
          {subtitle && <p className="mb-4 text-sm text-slate-400">{subtitle}</p>}
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link href="/mentions-legales" className="hover:text-slate-300">Mentions légales</Link>
          <span className="mx-2 text-slate-600">·</span>
          <Link href="/confidentialite" className="hover:text-slate-300">Confidentialité</Link>
          <span className="mx-2 text-slate-600">·</span>
          <Link href="/cgv" className="hover:text-slate-300">CGV</Link>
        </p>
      </div>
    </main>
  );
}

import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/70 px-4 py-6 text-center text-xs text-slate-400 print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span>© {new Date().getFullYear()} SnapAuto</span>
        <span className="text-slate-300">·</span>
        <Link href="/mentions-legales" className="transition hover:text-slate-300">
          Mentions légales
        </Link>
        <span className="text-slate-300">·</span>
        <Link href="/confidentialite" className="transition hover:text-slate-300">
          Confidentialité
        </Link>
      </div>
    </footer>
  );
}

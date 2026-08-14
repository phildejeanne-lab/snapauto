import Link from "next/link";
import { Brand } from "./Logo";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
        <Link href="/" className="transition hover:opacity-80">
          <Brand size={34} />
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link
            href="/dossiers"
            className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Mes dossiers
          </Link>
          <Link
            href="/compte"
            className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Mon espace
          </Link>
          <form action="/auth/signout" method="post">
            <button className="rounded-lg px-3 py-2 font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
              Déconnexion
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { Brand } from "./Logo";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/app" className="shrink-0 transition hover:opacity-80">
          <Brand size={28} />
        </Link>
        <form action="/auth/signout" method="post">
          <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200">
            Déconnexion
          </button>
        </form>
      </div>
    </header>
  );
}

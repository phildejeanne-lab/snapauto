"use client";

import { useState } from "react";
import Link from "next/link";
import { Brand } from "./Logo";

export function AppHeader() {
  const [open, setOpen] = useState(false);

  const links = (
    <>
      <Link
        href="/dossiers"
        onClick={() => setOpen(false)}
        className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        Mes dossiers
      </Link>
      <Link
        href="/clients"
        onClick={() => setOpen(false)}
        className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        Clients
      </Link>
      <Link
        href="/livre-police"
        onClick={() => setOpen(false)}
        className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        Livre de police
      </Link>
      <Link
        href="/compte"
        onClick={() => setOpen(false)}
        className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        Mon espace
      </Link>
      <form action="/auth/signout" method="post">
        <button className="w-full rounded-lg px-3 py-2 text-left font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
          Déconnexion
        </button>
      </form>
    </>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="shrink-0 transition hover:opacity-80">
          <Brand size={30} />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 text-sm sm:flex">{links}</nav>

        {/* Bouton menu mobile */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 sm:hidden"
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu mobile déroulant */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-slate-200/70 bg-white px-4 py-3 text-sm sm:hidden">
          {links}
          <div className="mt-1 flex gap-3 border-t border-slate-100 px-3 pt-2 text-xs text-slate-400">
            <Link href="/mentions-legales" onClick={() => setOpen(false)} className="hover:text-slate-600">
              Mentions légales
            </Link>
            <Link href="/confidentialite" onClick={() => setOpen(false)} className="hover:text-slate-600">
              Confidentialité
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

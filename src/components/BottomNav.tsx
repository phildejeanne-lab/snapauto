"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; icon: React.ReactNode; match: (p: string) => boolean };

const I = {
  scan: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  ),
  car: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" />
      <path d="M4 13h16a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H9v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
      <circle cx="7.5" cy="15.5" r="1" /><circle cx="16.5" cy="15.5" r="1" />
    </svg>
  ),
  docs: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  ),
  gear: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.14.63.65 1.12 1.29 1.28" />
    </svg>
  ),
};

const TABS: Tab[] = [
  { href: "/", label: "Scan", icon: I.scan, match: (p) => p === "/" },
  { href: "/livre-police", label: "Stock VO", icon: I.car, match: (p) => p.startsWith("/livre-police") },
  { href: "/dossiers", label: "Dossiers", icon: I.docs, match: (p) => p.startsWith("/dossiers") || p.startsWith("/clients") },
  { href: "/compte", label: "Réglages", icon: I.gear, match: (p) => p.startsWith("/compte") },
];

export function BottomNav() {
  const pathname = usePathname() || "/";
  const hidden =
    pathname === "/login" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/mentions-legales") ||
    pathname.startsWith("/confidentialite");
  if (hidden) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/80 backdrop-blur-xl print:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const isScan = t.href === "/";
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group flex flex-col items-center gap-1 py-2.5"
            >
              <span
                className={[
                  "grid h-9 w-9 place-items-center rounded-xl transition",
                  isScan
                    ? active
                      ? "bg-gradient-to-br from-cyan-400 to-brand-500 text-slate-950 shadow-lg shadow-cyan-500/30"
                      : "bg-gradient-to-br from-cyan-400/90 to-brand-500/90 text-slate-950"
                    : active
                      ? "text-accent"
                      : "text-slate-500 group-hover:text-slate-300",
                ].join(" ")}
              >
                {t.icon}
              </span>
              <span
                className={[
                  "text-[11px] font-medium transition",
                  active ? "text-slate-100" : "text-slate-500 group-hover:text-slate-300",
                ].join(" ")}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

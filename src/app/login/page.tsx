"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={60} className="mb-3" />
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
            Snap<span className="bg-gradient-to-r from-cyan-400 to-brand-400 bg-clip-text text-transparent">Auto</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Vos documents de cession auto, remplis depuis une photo.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center text-sm text-emerald-300">
            <p className="text-2xl">📬</p>
            <p className="mt-2">
              Lien de connexion envoyé à <strong>{email}</strong>.
              <br />
              Ouvre ta boîte mail et clique sur le lien.
            </p>
          </div>
        ) : (
          <form onSubmit={sendLink} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm shadow-slate-200/50">
            <h2 className="mb-1 text-lg font-semibold text-slate-100">Connexion</h2>
            <p className="mb-4 text-sm text-slate-400">Reçois un lien de connexion par email — sans mot de passe.</p>
            <p className="mb-4 text-xs text-slate-400">
              En vous connectant, vous acceptez notre{" "}
              <Link href="/confidentialite" className="text-brand-400 hover:underline">
                politique de confidentialité
              </Link>
              .
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@garage.fr"
              className="w-full input"
            />
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Envoi…" : "Recevoir mon lien"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Réservé aux professionnels de l'automobile.
        </p>
        <p className="mt-3 text-center text-xs text-slate-400">
          <Link href="/mentions-legales" className="hover:text-slate-300">
            Mentions légales
          </Link>
          <span className="mx-2 text-slate-300">·</span>
          <Link href="/confidentialite" className="hover:text-slate-300">
            Confidentialité
          </Link>
        </p>
      </div>
    </main>
  );
}

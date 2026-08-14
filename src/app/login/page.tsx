"use client";

import { useState } from "react";
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
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-600">
            Snap<span className="font-semibold text-ink">Auto</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Vos documents de cession auto, remplis depuis une photo.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-800">
            <p className="text-2xl">📬</p>
            <p className="mt-2">
              Lien de connexion envoyé à <strong>{email}</strong>.
              <br />
              Ouvre ta boîte mail et clique sur le lien.
            </p>
          </div>
        ) : (
          <form onSubmit={sendLink} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Connexion</h2>
            <p className="mb-4 text-sm text-slate-500">Reçois un lien de connexion par email — sans mot de passe.</p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@garage.fr"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
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
      </div>
    </main>
  );
}

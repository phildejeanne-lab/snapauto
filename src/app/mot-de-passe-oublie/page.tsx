"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Mot de passe oublié" subtitle="Recevez un lien pour le réinitialiser.">
      {sent ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-300">
          <p className="text-2xl">📬</p>
          <p className="mt-2">
            Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient
            d'être envoyé. Ouvrez votre boîte mail.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="label">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@garage.fr" className="input" />
          </label>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>
      )}
      <p className="mt-5 text-center text-sm text-slate-400">
        <Link href="/login" className="font-medium text-accent hover:underline">Retour à la connexion</Link>
      </p>
    </AuthShell>
  );
}

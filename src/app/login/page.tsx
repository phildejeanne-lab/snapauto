"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = "/app";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur.";
      setError(
        /invalid login/i.test(msg)
          ? "Email ou mot de passe incorrect."
          : /not confirmed/i.test(msg)
            ? "Compte non confirmé : clique sur le lien reçu par email."
            : msg,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Connexion" subtitle="Accédez à votre espace SnapAuto.">
      <form onSubmit={submit} className="space-y-3">
        <label className="flex flex-col gap-1">
          <span className="label">Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@garage.fr" className="input" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label">Mot de passe</span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input" />
        </label>
        <div className="text-right">
          <Link href="/mot-de-passe-oublie" className="text-xs text-slate-400 hover:text-slate-200">
            Mot de passe oublié ?
          </Link>
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">Créer un compte</Link>
      </p>
    </AuthShell>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (error) throw error;
      if (data.session) {
        // Confirmation d'email désactivée : connecté directement.
        window.location.href = "/app";
      } else {
        // Confirmation d'email activée : l'utilisateur doit valider par email.
        setCheckEmail(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur.";
      setError(/already registered|already exists/i.test(msg) ? "Un compte existe déjà avec cet email." : msg);
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <AuthShell title="Vérifiez votre email">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-300">
          <p className="text-2xl">📬</p>
          <p className="mt-2">
            Un email de confirmation a été envoyé à <strong>{email}</strong>.
            <br />
            Cliquez sur le lien pour activer votre compte, puis connectez-vous.
          </p>
        </div>
        <p className="mt-5 text-center text-sm text-slate-400">
          <Link href="/login" className="font-medium text-accent hover:underline">Retour à la connexion</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Créer un compte" subtitle="Essai gratuit, sans carte bancaire.">
      <form onSubmit={submit} className="space-y-3">
        <label className="flex flex-col gap-1">
          <span className="label">Email professionnel</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@garage.fr" className="input" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label">Mot de passe</span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" className="input" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label">Confirmer le mot de passe</span>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="input" />
        </label>
        <p className="text-xs text-slate-400">
          En créant un compte, vous acceptez nos{" "}
          <Link href="/cgv" className="text-brand-400 hover:underline">CGV</Link> et notre{" "}
          <Link href="/confidentialite" className="text-brand-400 hover:underline">politique de confidentialité</Link>.
        </p>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={loading} className="btn-cyan w-full">
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">Se connecter</Link>
      </p>
    </AuthShell>
  );
}

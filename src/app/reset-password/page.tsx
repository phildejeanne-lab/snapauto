"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState<boolean | null>(null); // session de récupération présente ?

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setReady(!!data.user);
    })();
  }, []);

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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      window.location.href = "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setLoading(false);
    }
  }

  if (ready === false) {
    return (
      <AuthShell title="Lien expiré">
        <p className="text-sm text-slate-400">
          Ce lien de réinitialisation n'est plus valide. Demandez-en un nouveau.
        </p>
        <p className="mt-5 text-center text-sm text-slate-400">
          <Link href="/mot-de-passe-oublie" className="font-medium text-accent hover:underline">
            Recevoir un nouveau lien
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nouveau mot de passe" subtitle="Choisissez un nouveau mot de passe.">
      <form onSubmit={submit} className="space-y-3">
        <label className="flex flex-col gap-1">
          <span className="label">Nouveau mot de passe</span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" className="input" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label">Confirmer</span>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="input" />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={loading || ready === null} className="btn-primary w-full">
          {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </AuthShell>
  );
}

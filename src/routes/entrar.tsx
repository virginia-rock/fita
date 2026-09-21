import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import { loadDemoSession, setDemoSession } from "@/lib/demo-account";
import { isSupabaseConfigured } from "@/lib/supabase";
import { signInWithSupabase } from "@/lib/supabase-auth";

export const Route = createFileRoute("/entrar")({
  head: () => ({ meta: [{ title: "Entrar · Fita." }] }),
  component: Entrar,
});

function Entrar() {
  const [error, setError] = useState("");

  return (
    <main className="min-h-screen bg-paper px-6 py-12 text-ink">
      <div className="mx-auto max-w-md">
        <Link to="/" className="label-caps text-clay hover:underline">
          ← voltar para o Fita.
        </Link>
        <div className="mt-12 rounded-sm bg-vellum/40 p-6 ring-1 ring-ink/10 md:p-8">
          <div className="label-caps text-clay">Acesso à sua conta</div>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">Entre no Fita.</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            Entre na sua conta para acessar suas fichas, histórico e configurações.
          </p>
          <div className="mt-8">
            <AuthForm
              mode="login"
              error={error}
              onSubmit={async ({ email, password }) => {
                if (isSupabaseConfigured) {
                  const { error: authError } = await signInWithSupabase(email, password);
                  if (authError) {
                    setError(authError.message);
                    return;
                  }
                  window.location.assign("/conta");
                  return;
                }
                const account = loadDemoSession();
                if (!account || account.email !== email || account.demoPassword !== password) {
                  setError("Não encontrei uma conta com esses dados. Crie uma conta primeiro.");
                  return;
                }
                setDemoSession({ ...account, emailConfirmed: true });
                window.location.assign("/conta");
              }}
            />
          </div>
          <p className="mt-6 text-center text-sm text-ink/55">
            Ainda não tem uma conta? <Link to="/criar-conta" className="text-clay hover:underline">Crie sua conta</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}

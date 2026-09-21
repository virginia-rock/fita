import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import { createDemoAccount, setDemoSession } from "@/lib/demo-account";
import { isSupabaseConfigured } from "@/lib/supabase";
import { signUpWithSupabase } from "@/lib/supabase-auth";

export const Route = createFileRoute("/criar-conta")({
  head: () => ({ meta: [{ title: "Criar conta · Fita." }] }),
  component: CriarConta,
});

function selectedPlan() {
  if (typeof window === "undefined") return "cloud_month";
  return new URLSearchParams(window.location.search).get("plan") === "subscription"
    ? "subscription"
    : "cloud_month";
}

function CriarConta() {
  const [createdEmail, setCreatedEmail] = useState("");
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [plan] = useState(selectedPlan);

  if (createdEmail) {
    return (
      <main className="min-h-screen bg-paper px-6 py-12 text-ink">
        <div className="mx-auto max-w-md">
          <Link to="/" className="label-caps text-clay hover:underline">← voltar para o Fita.</Link>
          <div className="mt-12 rounded-sm bg-vellum/40 p-6 ring-1 ring-ink/10 md:p-8">
            <div className="label-caps text-sage">Confirmação de e-mail</div>
            <h1 className="mt-3 text-3xl font-medium tracking-tight">Conta criada.</h1>
            <p className="mt-4 text-sm leading-relaxed text-ink/60">
              {requiresEmailConfirmation
                ? (
                    <>Enviamos um link de confirmação para <strong className="text-ink">{createdEmail}</strong>. Confirme seu e-mail e depois entre na conta para continuar.</>
                  )
                : (
                    <>Sua conta foi criada para <strong className="text-ink">{createdEmail}</strong>. Você pode continuar para o checkout.</>
                  )}
            </p>
            <button
              type="button"
              onClick={() => window.location.assign(requiresEmailConfirmation ? "/entrar" : `/checkout?plan=${plan}`)}
              className="mt-8 w-full rounded-sm bg-clay px-4 py-3 text-xs font-medium uppercase tracking-widest text-paper transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
            >
              {requiresEmailConfirmation ? "Ir para o login" : "Continuar para o checkout"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-6 py-12 text-ink">
      <div className="mx-auto max-w-md">
        <Link to="/" className="label-caps text-clay hover:underline">← voltar para o Fita.</Link>
        <div className="mt-12 rounded-sm bg-vellum/40 p-6 ring-1 ring-ink/10 md:p-8">
          <div className="label-caps text-clay">Comece pelo seu e-mail</div>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">Criar sua conta</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            A conta é necessária para acessar o Fita. Comece no plano gratuito ou continue para um plano Pro.
          </p>
          <div className="mt-8">
            <AuthForm
              mode="signup"
              error={error}
              onSubmit={async ({ email, password }) => {
                if (isSupabaseConfigured) {
                  const { session, error: authError } = await signUpWithSupabase(email, password);
                  if (authError) {
                    setError(authError.message);
                    return;
                  }
                  setCreatedEmail(email);
                  setRequiresEmailConfirmation(!session);
                  return;
                }
                const account = createDemoAccount(email, undefined, password);
                setDemoSession(account);
                setCreatedEmail(account.email);
              }}
            />
          </div>
          <p className="mt-6 text-center text-sm text-ink/55">
            Já tem uma conta? <Link to="/entrar" className="text-clay hover:underline">Entrar</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}

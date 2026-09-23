import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StripeCheckout } from "@/components/StripeCheckout";
import { loadDemoSession, type DemoAccount, type DemoPlan } from "@/lib/demo-account";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSupabaseAuth } from "@/lib/supabase-auth";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout · Fita." }] }),
  component: Checkout,
});

function readPlan(): Exclude<DemoPlan, "local"> {
  const value =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("plan") : null;
  const plans: Exclude<DemoPlan, "local">[] = [
    "cloud_month",
    "subscription",
    "subscription_monthly",
    "subscription_annual",
    "professional_personal",
    "professional_personal_pro",
    "professional_studio",
  ];
  return plans.includes(value as Exclude<DemoPlan, "local">)
    ? (value as Exclude<DemoPlan, "local">)
    : "cloud_month";
}

function Checkout() {
  const [demoAccount, setDemoAccount] = useState<DemoAccount | null>(null);
  const { user, loading: authLoading } = useSupabaseAuth();
  const [plan] = useState(readPlan);

  useEffect(() => setDemoAccount(loadDemoSession()), []);

  const account =
    (!isSupabaseConfigured ? demoAccount : demoAccount?.id === user?.id ? demoAccount : null) ??
    (user
      ? {
          id: user.id,
          email: user.email ?? "",
          emailConfirmed: Boolean(user.email_confirmed_at),
          plan: "local" as const,
          status: "active" as const,
          createdAt: user.created_at,
        }
      : null);

  if (authLoading || !account) {
    return (
      <main className="min-h-screen bg-paper px-6 py-12 text-ink">
        <div className="mx-auto max-w-md rounded-sm bg-vellum/40 p-6 ring-1 ring-ink/10 md:p-8">
          <div className="label-caps text-clay">Checkout</div>
          <h1 className="mt-3 text-3xl font-medium">Crie sua conta primeiro.</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            Você precisa de uma conta para continuar com o acesso pago.
          </p>
          <a
            href={`/criar-conta?plan=${plan}`}
            className="mt-8 inline-block rounded-sm bg-clay px-4 py-3 text-xs font-medium uppercase tracking-widest text-paper"
          >
            Criar conta
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-6 py-12 text-ink">
      <div className="mx-auto max-w-md">
        <Link to="/" className="label-caps text-clay hover:underline">
          ← voltar para o Fita.
        </Link>
        <div className="mt-12 rounded-sm bg-vellum/40 p-6 ring-1 ring-ink/10 md:p-8">
          <StripeCheckout plan={plan} account={account} />
        </div>
      </div>
    </main>
  );
}

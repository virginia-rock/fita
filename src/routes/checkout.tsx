import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SimulatedCheckout } from "@/components/SimulatedCheckout";
import {
  activateDemoPlan,
  loadDemoSession,
  saveDemoAccount,
  type DemoAccount,
  type DemoPlan,
} from "@/lib/demo-account";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSupabaseAuth } from "@/lib/supabase-auth";
import { activateDemoEntitlement } from "@/lib/supabase-entitlements";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout demo · Fita." }] }),
  component: Checkout,
});

function readPlan(): Exclude<DemoPlan, "local"> {
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("plan") === "subscription") {
    return "subscription";
  }
  return "cloud_month";
}

function Checkout() {
  const [demoAccount, setDemoAccount] = useState<DemoAccount | null>(null);
  const [activationError, setActivationError] = useState("");
  const { user, loading: authLoading } = useSupabaseAuth();
  const [plan] = useState(readPlan);

  useEffect(() => setDemoAccount(loadDemoSession()), []);

  const account = (!isSupabaseConfigured ? demoAccount : demoAccount?.id === user?.id ? demoAccount : null) ?? (user
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
          <Link to="/criar-conta" className="mt-8 inline-block rounded-sm bg-clay px-4 py-3 text-xs font-medium uppercase tracking-widest text-paper">
            Criar conta
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-6 py-12 text-ink">
      <div className="mx-auto max-w-md">
        <Link to="/" className="label-caps text-clay hover:underline">← voltar para o Fita.</Link>
        <div className="mt-12 rounded-sm bg-vellum/40 p-6 ring-1 ring-ink/10 md:p-8">
          <SimulatedCheckout
            plan={plan}
            account={account}
            onComplete={async () => {
              setActivationError("");
              try {
                await activateDemoEntitlement(plan);
                saveDemoAccount(activateDemoPlan(account, plan));
                window.location.assign("/conta");
              } catch {
                setActivationError("Não foi possível ativar o plano Pro no Supabase. Tente novamente.");
              }
            }}
          />
          {activationError && (
            <div className="mt-5 rounded-sm bg-clay/10 px-4 py-3 text-sm text-clay" role="alert">
              {activationError}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

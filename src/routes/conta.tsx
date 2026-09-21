import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MembershipStatus } from "@/components/MembershipStatus";
import {
  cancelDemoSubscription,
  clearDemoAccount,
  loadDemoSession,
  saveDemoAccount,
  type DemoAccount,
} from "@/lib/demo-account";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSupabaseAuth, signOutFromSupabase } from "@/lib/supabase-auth";

export const Route = createFileRoute("/conta")({
  head: () => ({ meta: [{ title: "Minha conta · Fita." }] }),
  component: Conta,
});

function Conta() {
  const [demoAccount, setDemoAccount] = useState<DemoAccount | null>(null);
  const { user, loading: authLoading } = useSupabaseAuth();

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
      <AppShell showLocalStorageNotice={false}>
        <div className="mx-auto max-w-md rounded-sm bg-vellum/40 p-6 ring-1 ring-ink/10 md:p-8">
          <div className="label-caps text-clay">Área da conta</div>
          <h1 className="mt-3 text-3xl font-medium">Entre para continuar.</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            A área de pagamentos e assinaturas fica disponível depois que você cria uma conta.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/entrar" className="rounded-sm bg-clay px-4 py-3 text-xs font-medium uppercase tracking-widest text-paper">
              Entrar
            </Link>
            <Link to="/criar-conta" className="rounded-sm bg-vellum px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/70 ring-1 ring-ink/10">
              Criar conta
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showLocalStorageNotice={false}>
      <div className="mx-auto">
        <div className="mt-12">
          <div className="label-caps text-clay">Minha conta</div>
          <h1 className="mt-3 text-4xl font-medium tracking-tight">Seu acesso ao Fita.</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/60">
            Aqui você acompanha sua conta e seu plano. O acesso ao app continua disponível mesmo
            quando uma assinatura é cancelada.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <MembershipStatus
            account={account}
            isSupabaseAccount={Boolean(user)}
            onCancelSubscription={() => {
              const canceled = cancelDemoSubscription(account);
              saveDemoAccount(canceled);
              setDemoAccount(canceled);
            }}
          />
          <div className="border-t border-ink/10 pt-5">
            <button
              type="button"
              onClick={async () => {
                await signOutFromSupabase();
                clearDemoAccount();
                window.location.assign("/");
              }}
              className="rounded-sm bg-vellum px-4 py-2 text-xs font-medium text-ink/70 ring-1 ring-ink/10 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

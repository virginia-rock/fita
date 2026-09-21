import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MembershipStatus } from "@/components/MembershipStatus";
import { useAppData } from "@/lib/storage";
import { isCloudEntitled } from "@/lib/entitlements";
import {
  cancelDemoSubscription,
  clearDemoAccount,
  loadDemoSession,
  saveDemoAccount,
  type DemoAccount,
} from "@/lib/demo-account";
import { cancelDemoEntitlement } from "@/lib/supabase-entitlements";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSupabaseAuth, signOutFromSupabase } from "@/lib/supabase-auth";

export const Route = createFileRoute("/conta")({
  head: () => ({ meta: [{ title: "Minha conta · Fita." }] }),
  component: Conta,
});

function Conta() {
  const [demoAccount, setDemoAccount] = useState<DemoAccount | null>(null);
  const [subscriptionError, setSubscriptionError] = useState("");
  const { user, loading: authLoading } = useSupabaseAuth();
  const { entitlement, entitlementLoading, entitlementError } = useAppData();

  useEffect(() => setDemoAccount(loadDemoSession()), []);

  const localAccount = (!isSupabaseConfigured ? demoAccount : demoAccount?.id === user?.id ? demoAccount : null) ?? (user
    ? {
        id: user.id,
        email: user.email ?? "",
        emailConfirmed: Boolean(user.email_confirmed_at),
        plan: "local" as const,
        status: "active" as const,
        createdAt: user.created_at,
      }
    : null);
  const account = entitlement
    ? {
        ...(localAccount ?? {
          id: entitlement.user_id,
          email: user?.email ?? "",
          emailConfirmed: Boolean(user?.email_confirmed_at),
          createdAt: user?.created_at ?? new Date().toISOString(),
        }),
        plan: entitlement.plan,
        status: entitlement.status,
        ...(entitlement.expires_at ? { expiresAt: entitlement.expires_at } : {}),
      }
    : localAccount;
  const cloudSyncEnabled = isCloudEntitled(entitlement);

  if (authLoading || entitlementLoading) {
    return (
      <AppShell showLocalStorageNotice={false}>
        <div className="mx-auto max-w-md rounded-sm bg-vellum/40 p-6 ring-1 ring-ink/10 md:p-8">
          <div className="label-caps text-clay">Área da conta</div>
          <h1 className="mt-3 text-3xl font-medium">Carregando seu plano.</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">Só um instante.</p>
        </div>
      </AppShell>
    );
  }

  if (!account) {
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
          {entitlementError ? (
            <div className="rounded-sm bg-clay/10 p-5 text-sm text-clay" role="alert">
              Não foi possível verificar seu plano no Supabase. Tente novamente em instantes.
            </div>
          ) : (
            <MembershipStatus
              account={account}
              isSupabaseAccount={Boolean(user)}
              cloudSyncEnabled={cloudSyncEnabled}
              onCancelSubscription={async () => {
                setSubscriptionError("");
                try {
                  await cancelDemoEntitlement();
                  const canceled = cancelDemoSubscription(account);
                  saveDemoAccount(canceled);
                  setDemoAccount(canceled);
                } catch {
                  setSubscriptionError("Não foi possível cancelar o plano Pro no Supabase.");
                }
              }}
            />
          )}
          {subscriptionError && (
            <div className="rounded-sm bg-clay/10 p-4 text-sm text-clay" role="alert">
              {subscriptionError}
            </div>
          )}
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

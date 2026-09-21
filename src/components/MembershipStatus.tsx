import type { DemoAccount } from "@/lib/demo-account";

type MembershipStatusProps = {
  account: DemoAccount | null;
  isSupabaseAccount?: boolean;
  onCancelSubscription?: () => void;
};

export function MembershipStatus({ account, isSupabaseAccount = false, onCancelSubscription }: MembershipStatusProps) {
  if (!account || account.plan === "local") {
    return (
      <div className="rounded-sm bg-vellum/50 p-5 ring-1 ring-ink/10">
        <div className="label-caps text-ink/45">Plano atual</div>
        <h2 className="mt-2 text-xl font-medium">{isSupabaseAccount ? "Plano gratuito" : "Teste local"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          {isSupabaseAccount
            ? "Sua conta está conectada ao Supabase. As fichas e o histórico são sincronizados na nuvem."
            : "Você está usando o Fita sem cadastro e sem armazenamento em nuvem."}
        </p>
      </div>
    );
  }

  if (account.plan === "cloud_month") {
    const expiry = account.expiresAt
      ? new Date(account.expiresAt).toLocaleDateString("pt-BR")
      : "data não definida";
    return (
      <div className="rounded-sm bg-clay/5 p-5 ring-1 ring-clay/20">
        <div className="label-caps text-clay">Pagamento único · demonstração</div>
        <h2 className="mt-2 text-xl font-medium">Armazenamento em nuvem</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Acesso simulado até <strong className="text-ink">{expiry}</strong>. A nuvem ainda não está
          conectada nesta versão.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-sm bg-clay/5 p-5 ring-1 ring-clay/20">
      <div className="label-caps text-clay">Assinatura · demonstração</div>
      <h2 className="mt-2 text-xl font-medium">Plano recorrente</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/60">
        {account.status === "canceled"
          ? "Sua assinatura foi cancelada. Sua conta continua ativa e você pode usar o Fita normalmente, como no plano gratuito, sem sincronização com a nuvem."
          : "Acesso simulado enquanto a assinatura estiver ativa. A cobrança real ainda não está conectada."}
      </p>
      {account.status === "active" && onCancelSubscription && (
        <button
          type="button"
          onClick={onCancelSubscription}
          className="mt-5 rounded-sm bg-vellum px-4 py-2 text-xs font-medium text-ink/75 ring-1 ring-ink/10 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
        >
          Cancelar assinatura demo
        </button>
      )}
    </div>
  );
}

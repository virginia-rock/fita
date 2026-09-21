import type { DemoAccount, DemoPlan } from "@/lib/demo-account";

type SimulatedCheckoutProps = {
  plan: Exclude<DemoPlan, "local">;
  account: DemoAccount;
  onComplete: () => void;
};

const PLAN_DETAILS = {
  cloud_month: {
    name: "Acesso mensal",
    price: "R$ 29,90",
    description: "Pagamento único com um mês de armazenamento em nuvem.",
  },
  subscription: {
    name: "Apoio recorrente",
    price: "R$ 19,90/mês",
    description: "Assinatura demo com acesso enquanto estiver ativa.",
  },
} as const;

export function SimulatedCheckout({ plan, account, onComplete }: SimulatedCheckoutProps) {
  const details = PLAN_DETAILS[plan];

  return (
    <div className="space-y-6">
      <div className="rounded-sm bg-vellum/60 p-5 ring-1 ring-ink/10">
        <div className="label-caps text-clay">Checkout simulado</div>
        <h2 className="mt-2 text-2xl font-medium">{details.name}</h2>
        <div className="num mt-3 text-3xl font-medium">{details.price}</div>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">{details.description}</p>
      </div>
      <div className="text-sm text-ink/60">
        Conta: <strong className="text-ink">{account.email}</strong>
      </div>
      <div className="rounded-sm border-l-2 border-sage bg-sage/10 px-4 py-3 text-sm text-ink/70">
        Nenhum pagamento real será processado. Este botão apenas demonstra o próximo estado do
        produto.
      </div>
      <button
        type="button"
        onClick={onComplete}
        className="w-full rounded-sm bg-clay px-4 py-3 text-xs font-medium uppercase tracking-widest text-paper transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
      >
        Simular pagamento aprovado
      </button>
    </div>
  );
}

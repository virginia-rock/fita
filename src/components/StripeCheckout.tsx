import { useState } from "react";
import type { DemoAccount, DemoPlan } from "@/lib/demo-account";
import { createStripeCheckoutSession } from "@/lib/stripe-checkout";
import {
  checkoutErrorMessage,
  isCheckoutBusy,
  type StripeCheckoutState,
} from "@/lib/stripe-checkout-state";

type StripeCheckoutProps = {
  plan: Exclude<DemoPlan, "local">;
  account: DemoAccount;
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
    description: "Assinatura recorrente com acesso enquanto estiver ativa.",
  },
  subscription_monthly: {
    name: "Fita Pro mensal",
    price: "R$ 14,90/mês",
    description: "Assinatura recorrente com sincronização e backup na nuvem.",
  },
  subscription_annual: {
    name: "Fita Pro anual",
    price: "R$ 119,90/ano",
    description: "Assinatura anual com o melhor custo-benefício do Fita Pro.",
  },
  professional_personal: {
    name: "Fita Personal",
    price: "R$ 39,90/mês",
    description: "Acompanhe até 10 alunos com medidas, avaliações e histórico.",
  },
  professional_personal_pro: {
    name: "Fita Personal Pro",
    price: "R$ 69,90/mês",
    description: "Acompanhe até 30 alunos com dashboard e relatórios.",
  },
  professional_studio: {
    name: "Fita Studio",
    price: "R$ 149/mês",
    description: "Acompanhe até 100 alunos em uma operação profissional.",
  },
} as const;

export function StripeCheckout({ plan, account }: StripeCheckoutProps) {
  const [state, setState] = useState<StripeCheckoutState>("idle");
  const [error, setError] = useState("");
  const details = PLAN_DETAILS[plan];
  const busy = isCheckoutBusy(state);

  const startCheckout = async () => {
    if (busy) return;
    setError("");
    setState("redirecting");
    try {
      const { url } = await createStripeCheckoutSession(plan);
      window.location.assign(url);
    } catch (checkoutError) {
      const message = checkoutErrorMessage(checkoutError);
      setError(message);
      setState(message.includes("configurado") ? "configuration_error" : "request_error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-sm bg-vellum/60 p-5 ring-1 ring-ink/10">
        <div className="label-caps text-clay">Checkout Stripe</div>
        <h2 className="mt-2 text-2xl font-medium">{details.name}</h2>
        <div className="num mt-3 text-3xl font-medium">{details.price}</div>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">{details.description}</p>
      </div>
      <div className="text-sm text-ink/60">
        Conta: <strong className="text-ink">{account.email}</strong>
      </div>
      <div className="rounded-sm border-l-2 border-sage bg-sage/10 px-4 py-3 text-sm text-ink/70">
        Você será direcionado para o Checkout seguro do Stripe. O acesso Pro é liberado após a
        confirmação do pagamento.
      </div>
      {error && (
        <div className="rounded-sm bg-clay/10 px-4 py-3 text-sm text-clay" role="alert">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={startCheckout}
        disabled={busy}
        className="w-full rounded-sm bg-clay px-4 py-3 text-xs font-medium uppercase tracking-widest text-paper transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? "Abrindo checkout…" : "Continuar para o Stripe"}
      </button>
    </div>
  );
}

import type { DemoAccount } from "@/lib/demo-account";

export type CanceledMembershipStatus = {
  eyebrow: "Plano atual";
  title: "Plano gratuito";
  description: string;
  actionLabel: "Fazer upgrade";
  actionHref: "/#planos";
};

export function getMembershipStatus(
  account: Pick<DemoAccount, "plan" | "status">,
): CanceledMembershipStatus | null {
  if (!account.plan.startsWith("subscription") || account.status !== "canceled") {
    return null;
  }

  return {
    eyebrow: "Plano atual",
    title: "Plano gratuito",
    description:
      "Sua assinatura foi cancelada. Sua conta continua ativa e você pode usar o Fita normalmente, sem sincronização com a nuvem.",
    actionLabel: "Fazer upgrade",
    actionHref: "/#planos",
  };
}

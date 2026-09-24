import test from "node:test";
import assert from "node:assert/strict";

const { getMembershipStatus } = await import("../src/lib/membership-status.ts");

test("canceled subscription is presented as the current free plan with an upgrade action", () => {
  const status = getMembershipStatus({ plan: "subscription_monthly", status: "canceled" });

  assert.deepEqual(status, {
    eyebrow: "Plano atual",
    title: "Plano gratuito",
    description:
      "Sua assinatura foi cancelada. Sua conta continua ativa e você pode usar o Fita normalmente, sem sincronização com a nuvem.",
    actionLabel: "Fazer upgrade",
    actionHref: "/#planos",
  });
});

test("canceled Personal Insider is also presented as the free plan", () => {
  const status = getMembershipStatus({ plan: "professional_personal", status: "canceled" });

  assert.equal(status?.title, "Plano gratuito");
  assert.equal(status?.actionHref, "/#planos");
});

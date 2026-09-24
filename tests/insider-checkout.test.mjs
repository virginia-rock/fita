import test from "node:test";
import assert from "node:assert/strict";

const { insiderCheckoutConfig } = await import(
  "../supabase/functions/_shared/insider-checkout.ts"
);

test("maps each eligible Insider offer to its private recurring price", () => {
  assert.deepEqual(insiderCheckoutConfig("pro_monthly"), {
    envName: "FITA_PRO_MONTHLY_INSIDER",
    plan: "subscription_monthly",
    trialPeriodDays: 90,
  });
  assert.deepEqual(insiderCheckoutConfig("personal"), {
    envName: "FITA_PERSONAL_INSIDER",
    plan: "professional_personal",
    trialPeriodDays: 90,
  });
  assert.equal(insiderCheckoutConfig("unknown"), null);
});

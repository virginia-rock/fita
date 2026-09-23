import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePaidPlan,
  planForPriceId,
  priceIdForPlan,
} from "../supabase/functions/_shared/stripe-config.ts";

const env = {
  STRIPE_PRICE_CLOUD_MONTH: "price_cloud_month_test",
  STRIPE_PRICE_SUBSCRIPTION: "price_subscription_test",
  STRIPE_PRICE_PRO_MONTHLY: "price_pro_monthly_test",
  STRIPE_PRICE_PRO_ANNUAL: "price_pro_annual_test",
  STRIPE_PRICE_PERSONAL: "price_personal_test",
  STRIPE_PRICE_PERSONAL_PRO: "price_personal_pro_test",
  STRIPE_PRICE_STUDIO: "price_studio_test",
};

test("accepts legacy and new paid plans", () => {
  assert.equal(parsePaidPlan("cloud_month"), "cloud_month");
  assert.equal(parsePaidPlan("subscription"), "subscription");
  assert.equal(parsePaidPlan("local"), null);
  assert.equal(parsePaidPlan("price_subscription_test"), null);
  assert.equal(parsePaidPlan(undefined), null);
  assert.equal(parsePaidPlan("subscription_monthly"), "subscription_monthly");
  assert.equal(parsePaidPlan("professional_personal"), "professional_personal");
  assert.equal(parsePaidPlan("professional_studio"), "professional_studio");
});

test("maps each paid plan to its configured Price ID", () => {
  assert.equal(priceIdForPlan("cloud_month", env), "price_cloud_month_test");
  assert.equal(priceIdForPlan("subscription", env), "price_subscription_test");
  assert.equal(planForPriceId("price_cloud_month_test", env), "cloud_month");
  assert.equal(planForPriceId("price_subscription_test", env), "subscription");
  assert.equal(priceIdForPlan("subscription_monthly", env), "price_pro_monthly_test");
  assert.equal(priceIdForPlan("subscription_annual", env), "price_pro_annual_test");
  assert.equal(priceIdForPlan("professional_personal", env), "price_personal_test");
  assert.equal(priceIdForPlan("professional_personal_pro", env), "price_personal_pro_test");
  assert.equal(priceIdForPlan("professional_studio", env), "price_studio_test");
  assert.equal(planForPriceId("price_pro_monthly_test", env), "subscription_monthly");
  assert.equal(planForPriceId("price_pro_annual_test", env), "subscription_annual");
  assert.equal(planForPriceId("price_personal_test", env), "professional_personal");
  assert.equal(planForPriceId("price_personal_pro_test", env), "professional_personal_pro");
  assert.equal(planForPriceId("price_studio_test", env), "professional_studio");
  assert.equal(planForPriceId("price_unknown", env), null);
});

test("fails closed when Price IDs are missing or duplicated", () => {
  assert.throws(() => priceIdForPlan("cloud_month", {}), /Price ID/);
  assert.equal(
    planForPriceId("price_same", {
      STRIPE_PRICE_CLOUD_MONTH: "price_same",
      STRIPE_PRICE_SUBSCRIPTION: "price_same",
    }),
    null,
  );
});

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
};

test("accepts only the two paid plans", () => {
  assert.equal(parsePaidPlan("cloud_month"), "cloud_month");
  assert.equal(parsePaidPlan("subscription"), "subscription");
  assert.equal(parsePaidPlan("local"), null);
  assert.equal(parsePaidPlan("price_subscription_test"), null);
  assert.equal(parsePaidPlan(undefined), null);
});

test("maps each paid plan to its configured Price ID", () => {
  assert.equal(priceIdForPlan("cloud_month", env), "price_cloud_month_test");
  assert.equal(priceIdForPlan("subscription", env), "price_subscription_test");
  assert.equal(planForPriceId("price_cloud_month_test", env), "cloud_month");
  assert.equal(planForPriceId("price_subscription_test", env), "subscription");
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

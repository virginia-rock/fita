import test from "node:test";
import assert from "node:assert/strict";
import {
  isNewStripeEvent,
  mapStripeEventToEntitlement,
} from "../supabase/functions/_shared/stripe-event-mapper.ts";

const env = {
  STRIPE_PRICE_CLOUD_MONTH: "price_cloud_month_test",
  STRIPE_PRICE_SUBSCRIPTION: "price_subscription_test",
};

const now = new Date("2026-09-22T12:00:00.000Z");

function event(type, object, id = `evt_${type}`) {
  return { id, type, data: { object } };
}

test("activates a one-time Checkout payment for 30 days", () => {
  const result = mapStripeEventToEntitlement(
    event("checkout.session.completed", {
      mode: "payment",
      payment_status: "paid",
      metadata: { supabase_user_id: "user-123", plan: "cloud_month" },
      price_id: "price_cloud_month_test",
      customer: "cus_123",
      id: "cs_123",
    }),
    env,
    now,
  );

  assert.deepEqual(result, {
    eventId: "evt_checkout.session.completed",
    eventType: "checkout.session.completed",
    userId: "user-123",
    plan: "cloud_month",
    status: "active",
    expiresAt: "2026-10-22T12:00:00.000Z",
    currentPeriodEnd: null,
    stripeCustomerId: "cus_123",
    stripeSubscriptionId: null,
    stripeCheckoutSessionId: "cs_123",
    stripePriceId: "price_cloud_month_test",
  });
});

test("maps subscription lifecycle and invoice payment events", () => {
  const subscription = mapStripeEventToEntitlement(
    event("customer.subscription.updated", {
      status: "active",
      metadata: { supabase_user_id: "user-123", plan: "subscription" },
      price_id: "price_subscription_test",
      customer: "cus_123",
      id: "sub_123",
      current_period_end: 1790078400,
    }),
    env,
    now,
  );
  assert.equal(subscription?.status, "active");
  assert.equal(subscription?.plan, "subscription");
  assert.equal(subscription?.stripeSubscriptionId, "sub_123");

  const failed = mapStripeEventToEntitlement(
    event("invoice.payment_failed", {
      metadata: { supabase_user_id: "user-123", plan: "subscription" },
      price_id: "price_subscription_test",
      customer: "cus_123",
      subscription: "sub_123",
    }, "evt_invoice_failed"),
    env,
    now,
  );
  assert.equal(failed?.status, "pending");
});

test("ignores invalid and failed events, and deduplicates event IDs", () => {
  assert.equal(
    mapStripeEventToEntitlement(
      event("checkout.session.completed", {
        mode: "payment",
        payment_status: "unpaid",
        metadata: { supabase_user_id: "user-123", plan: "cloud_month" },
        price_id: "price_cloud_month_test",
      }),
      env,
      now,
    ),
    null,
  );
  assert.equal(
    mapStripeEventToEntitlement(
      event("checkout.session.completed", {
        mode: "payment",
        payment_status: "paid",
        metadata: { supabase_user_id: "user-123", plan: "cloud_month" },
        price_id: "price_unknown",
      }),
      env,
      now,
    ),
    null,
  );
  assert.equal(isNewStripeEvent("evt_1", new Set()), true);
  assert.equal(isNewStripeEvent("evt_1", new Set(["evt_1"])), false);
});

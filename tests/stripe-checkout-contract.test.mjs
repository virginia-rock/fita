import test from "node:test";
import assert from "node:assert/strict";
import {
  checkoutMetadata,
  parseCheckoutRequest,
} from "../supabase/functions/_shared/checkout-contract.ts";

test("accepts only a paid plan in a checkout request", () => {
  assert.equal(parseCheckoutRequest({ plan: "cloud_month" }), "cloud_month");
  assert.equal(parseCheckoutRequest({ plan: "subscription" }), "subscription");
  assert.throws(() => parseCheckoutRequest({ plan: "local" }), /Invalid paid plan/);
  assert.throws(() => parseCheckoutRequest({}), /Invalid paid plan/);
});

test("creates stable Checkout metadata from the authenticated user", () => {
  assert.deepEqual(checkoutMetadata("user-123", "subscription"), {
    supabase_user_id: "user-123",
    plan: "subscription",
  });
});

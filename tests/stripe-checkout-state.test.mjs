import test from "node:test";
import assert from "node:assert/strict";
import { checkoutErrorMessage, isCheckoutBusy } from "../src/lib/stripe-checkout-state.ts";

test("marks only redirecting checkout as busy", () => {
  assert.equal(isCheckoutBusy("idle"), false);
  assert.equal(isCheckoutBusy("redirecting"), true);
  assert.equal(isCheckoutBusy("configuration_error"), false);
  assert.equal(isCheckoutBusy("request_error"), false);
});

test("returns a safe message for missing configuration and request failures", () => {
  assert.match(
    checkoutErrorMessage(new Error("STRIPE_SECRET_KEY is not configured.")),
    /não está configurado/i,
  );
  assert.match(checkoutErrorMessage(new Error("network failed")), /não foi possível iniciar/i);
  assert.match(checkoutErrorMessage("unknown"), /não foi possível iniciar/i);
});

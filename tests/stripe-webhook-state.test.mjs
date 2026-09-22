import test from "node:test";
import assert from "node:assert/strict";
import { webhookFailureStatus } from "../supabase/functions/_shared/webhook-contract.ts";

test("returns client error for invalid webhook signatures and server error for retryable failures", () => {
  const signatureError = new Error(
    "No signatures found matching the expected signature for payload.",
  );
  signatureError.name = "StripeSignatureVerificationError";
  assert.equal(webhookFailureStatus(signatureError), 400);
  assert.equal(webhookFailureStatus(new Error("database unavailable")), 500);
  assert.equal(webhookFailureStatus("unknown"), 500);
});

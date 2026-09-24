import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("webhook forwards subscription start to the Stripe RPC", async () => {
  const source = await readFile(
    new URL("../supabase/functions/stripe-webhook/index.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /p_subscribed_at:\s*mutation\.subscribedAt/);
});

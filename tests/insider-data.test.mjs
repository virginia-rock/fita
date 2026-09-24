import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const { parseInsiderAccess } = await import("../src/lib/insider.ts");

test("parses a valid Insider eligibility record", () => {
  assert.deepEqual(
    parseInsiderAccess({
      user_id: "user-1",
      offer: "pro_monthly",
      status: "eligible",
      selected_at: "2026-09-24T12:00:00.000Z",
      claimed_at: null,
      trial_ends_at: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
    }),
    {
      user_id: "user-1",
      offer: "pro_monthly",
      status: "eligible",
      selected_at: "2026-09-24T12:00:00.000Z",
      claimed_at: null,
      trial_ends_at: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
    },
  );
});

test("rejects malformed Insider eligibility records", () => {
  assert.equal(parseInsiderAccess({ offer: "pro_monthly" }), null);
  assert.equal(
    parseInsiderAccess({
      user_id: "user-1",
      offer: "annual",
      status: "eligible",
      selected_at: "2026-09-24T12:00:00.000Z",
      claimed_at: null,
      trial_ends_at: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
    }),
    null,
  );
});

test("insider migration protects selected users and extends entitlements", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/20260924000000_create_fita_insider_access.sql", import.meta.url),
    "utf8",
  );

  assert.match(sql, /create table if not exists public\.fita_insider_access/i);
  assert.match(sql, /offer in \('pro_monthly', 'personal'\)/i);
  assert.match(sql, /status in \('eligible', 'active', 'canceled'\)/i);
  assert.match(sql, /alter table public\.fita_insider_access enable row level security/i);
  assert.match(sql, /for select[\s\S]*auth\.uid\(\)[\s\S]*= user_id/i);
  assert.match(sql, /add column if not exists insider_offer text/i);
  assert.match(sql, /add column if not exists trial_ends_at timestamptz/i);
});

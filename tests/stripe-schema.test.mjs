import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationPath = new URL(
  "../supabase/migrations/20260922000000_add_stripe_billing.sql",
  import.meta.url,
);

test("adds Stripe fields to fita_entitlements", async () => {
  const sql = await readFile(migrationPath, "utf8");
  for (const column of [
    "stripe_customer_id",
    "stripe_subscription_id",
    "stripe_checkout_session_id",
    "stripe_price_id",
    "current_period_end",
    "last_stripe_event_id",
  ]) {
    assert.match(sql, new RegExp(`add column if not exists ${column}`));
  }
  assert.match(sql, /create index if not exists .*stripe_subscription_id/);
});

test("creates a private idempotency table for Stripe events", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /create table if not exists public\.fita_stripe_events/);
  assert.match(sql, /event_id text primary key/);
  assert.match(sql, /event_type text not null/);
  assert.match(
    sql,
    /revoke all on table public\.fita_stripe_events from public, anon, authenticated/,
  );
});

test("provides a transactional Stripe entitlement RPC", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /create or replace function public\.apply_stripe_entitlement_event/);
  assert.match(sql, /on conflict \(event_id\) do nothing/);
  assert.match(sql, /insert into public\.fita_entitlements/);
});

test("allows new Pro and professional Stripe plan identifiers", async () => {
  const sql = await readFile(
    new URL(
      "../supabase/migrations/20260923000001_add_professional_stripe_plans.sql",
      import.meta.url,
    ),
    "utf8",
  );
  for (const plan of [
    "subscription_monthly",
    "subscription_annual",
    "professional_personal",
    "professional_personal_pro",
    "professional_studio",
  ]) {
    assert.match(sql, new RegExp(plan));
  }
});

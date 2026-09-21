import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationPath = new URL(
  "../supabase/migrations/20260921000001_create_fita_entitlements.sql",
  import.meta.url,
);

test("entitlement migration defines a protected user-owned plan table", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /create table if not exists public\.fita_entitlements/i);
  assert.match(sql, /user_id uuid primary key references auth\.users \(id\) on delete cascade/i);
  assert.match(sql, /check \(plan in \('local', 'cloud_month', 'subscription'\)\)/i);
  assert.match(sql, /check \(status in \('active', 'expired', 'canceled', 'pending'\)\)/i);
  assert.match(sql, /check \(source in \('demo', 'stripe'\)\)/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /auth\.uid\(\)\)\s*=\s*user_id/i);
  assert.match(sql, /create or replace function public\.activate_demo_entitlement/i);
  assert.match(sql, /grant execute on function public\.activate_demo_entitlement\(text\) to authenticated/i);
  assert.match(sql, /create or replace function public\.cancel_demo_entitlement/i);
  assert.match(sql, /grant execute on function public\.cancel_demo_entitlement\(\) to authenticated/i);
});

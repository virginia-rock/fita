import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("admin migration persists role and subscription start", async () => {
  const sql = await readFile(
    new URL(
      "../supabase/migrations/20260924000002_create_fita_admin_access.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(sql, /create table if not exists public\.fita_admin_access/i);
  assert.match(sql, /lower\(email\) = 'carlospessin@gmail\.com'/i);
  assert.match(sql, /alter table public\.fita_admin_access enable row level security/i);
  assert.match(sql, /for select[\s\S]*auth\.uid\(\)[\s\S]*= user_id/i);
  assert.match(sql, /add column if not exists subscribed_at timestamptz/i);
  assert.match(sql, /p_subscribed_at timestamptz/i);
  assert.match(
    sql,
    /subscribed_at = coalesce\(public\.fita_entitlements\.subscribed_at, excluded\.subscribed_at\)/i,
  );
});

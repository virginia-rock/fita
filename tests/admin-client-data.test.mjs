import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const { parseAdminDashboard, parseAdminUsersPage } = await import("../src/lib/admin-dashboard-data.ts");

const counts = { all: 3, free: 1, cloud_month: 0, subscription: 0, subscription_monthly: 1, subscription_annual: 0, professional_personal: 0, professional_personal_pro: 0, professional_studio: 1 };

test("parses complete dashboard data and rejects malformed user rows", () => {
  assert.deepEqual(parseAdminDashboard({ counts }), { counts });
  assert.equal(parseAdminUsersPage({ items: [{ email: 3 }], total: 1 }), null);
});

test("loads only the current persisted admin role", async () => {
  const source = await readFile(new URL("../src/lib/supabase-entitlements.ts", import.meta.url), "utf8");
  assert.match(source, /from\("fita_admin_access"\)/);
  assert.match(source, /select\("role"\)/);
  assert.match(source, /eq\("user_id", userData\.user\.id\)/);
});

import test from "node:test";
import assert from "node:assert/strict";

const { classifyAdminUser, parseAdminUsersRequest } = await import(
  "../supabase/functions/_shared/admin-dashboard.ts"
);

test("classifies inactive and local entitlements as free", () => {
  for (const entitlement of [
    null,
    { plan: "local", status: "active" },
    { plan: "subscription_monthly", status: "canceled" },
    { plan: "subscription_monthly", status: "expired" },
  ]) {
    assert.equal(classifyAdminUser(entitlement), "free");
  }
  assert.equal(classifyAdminUser({ plan: "professional_studio", status: "active" }), "professional_studio");
  assert.equal(classifyAdminUser({ plan: "subscription_monthly", status: "pending" }), "subscription_monthly");
});

test("allows only bounded admin list requests", () => {
  assert.deepEqual(parseAdminUsersRequest({ plan: "free", page: 0, limit: 25 }), {
    plan: "free",
    page: 0,
    limit: 25,
  });
  assert.equal(parseAdminUsersRequest({ plan: "drop table", page: 0, limit: 25 }), null);
  assert.equal(parseAdminUsersRequest({ plan: "free", page: -1, limit: 25 }), null);
  assert.equal(parseAdminUsersRequest({ plan: "free", page: 0, limit: 101 }), null);
});

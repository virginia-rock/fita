import test from "node:test";
import assert from "node:assert/strict";

const { canUseCloudSync, shouldMigrateLegacyEntitlement } = await import(
  "../src/lib/entitlements.ts"
);

test("remote active Pro entitlement enables sync only after loading", () => {
  const entitlement = {
    user_id: "user-1",
    plan: "subscription",
    status: "active",
    expires_at: null,
    source: "demo",
  };

  assert.equal(canUseCloudSync(entitlement, false, null), true);
  assert.equal(canUseCloudSync(entitlement, true, null), false);
  assert.equal(canUseCloudSync(entitlement, false, new Error("network")), false);
});

test("free entitlement does not enable sync", () => {
  assert.equal(
    canUseCloudSync(
      {
        user_id: "user-1",
        plan: "local",
        status: "active",
        expires_at: null,
        source: "demo",
      },
      false,
      null,
    ),
    false,
  );
});

test("matching legacy local Pro can be migrated only when remote data is absent", () => {
  const legacy = {
    id: "user-1",
    plan: "cloud_month",
    status: "active",
    expiresAt: "2026-09-22T12:00:00.000Z",
  };

  assert.equal(shouldMigrateLegacyEntitlement(legacy, "user-1", null), true);
  assert.equal(shouldMigrateLegacyEntitlement(legacy, "other-user", null), false);
  assert.equal(
    shouldMigrateLegacyEntitlement(legacy, "user-1", {
      user_id: "user-1",
      plan: "subscription",
      status: "active",
      expires_at: null,
      source: "stripe",
    }),
    false,
  );
});

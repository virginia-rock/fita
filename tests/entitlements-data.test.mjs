import test from "node:test";
import assert from "node:assert/strict";

const { isCloudEntitled, parseEntitlement } = await import("../src/lib/entitlements.ts");

const now = new Date("2026-09-21T12:00:00.000Z");

test("active subscription entitlement enables cloud sync", () => {
  assert.equal(
    isCloudEntitled(
      {
        user_id: "user-1",
        plan: "subscription",
        status: "active",
        expires_at: null,
        source: "demo",
      },
      now,
    ),
    true,
  );
});

test("active monthly entitlement enables cloud sync before expiry", () => {
  assert.equal(
    isCloudEntitled(
      {
        user_id: "user-1",
        plan: "cloud_month",
        status: "active",
        expires_at: "2026-09-22T12:00:00.000Z",
        source: "stripe",
      },
      now,
    ),
    true,
  );
});

test("expired or canceled entitlements do not enable cloud sync", () => {
  assert.equal(
    isCloudEntitled(
      {
        user_id: "user-1",
        plan: "cloud_month",
        status: "active",
        expires_at: "2026-09-20T12:00:00.000Z",
        source: "demo",
      },
      now,
    ),
    false,
  );
  assert.equal(
    isCloudEntitled(
      {
        user_id: "user-1",
        plan: "subscription",
        status: "canceled",
        expires_at: null,
        source: "demo",
      },
      now,
    ),
    false,
  );
});

test("invalid entitlement payloads are rejected", () => {
  assert.equal(parseEntitlement({ plan: "subscription" }), null);
  assert.equal(parseEntitlement({ user_id: "user-1", plan: "local", status: "active", source: "demo" }), null);
});

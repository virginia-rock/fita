import test from "node:test";
import assert from "node:assert/strict";

const { createDemoAccount, activateDemoPlan, parseDemoAccount } = await import(
  "../src/lib/demo-account.ts"
);

test("creates a local account without payment entitlement", () => {
  const account = createDemoAccount("test@example.com", () => "demo-1");

  assert.equal(account.email, "test@example.com");
  assert.equal(account.plan, "local");
  assert.equal(account.status, "anonymous");
  assert.equal(account.emailConfirmed, false);
});

test("activates one-time cloud access for thirty days", () => {
  const account = createDemoAccount("test@example.com", () => "demo-1");
  const activated = activateDemoPlan(account, "cloud_month", new Date("2026-09-21T12:00:00Z"));

  assert.equal(activated.plan, "cloud_month");
  assert.equal(activated.status, "active");
  assert.equal(activated.expiresAt, "2026-10-21T12:00:00.000Z");
});

test("rejects malformed demo account data", () => {
  assert.equal(parseDemoAccount('{"email":"missing-fields"}'), null);
});

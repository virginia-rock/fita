import test from "node:test";
import assert from "node:assert/strict";
import { canStudentEdit, canProfessionalManageLink } from "../src/lib/professional-links.ts";
import { isCloudEntitled } from "../src/lib/entitlements.ts";

test("ending a link restores student editing without changing the individual entitlement", () => {
  const link = {
    id: "link-1",
    professional_user_id: "pro-1",
    student_user_id: "student-1",
    status: "ended",
    can_student_edit: false,
  };
  assert.equal(canStudentEdit(link, "student-1"), true);
  assert.equal(canProfessionalManageLink(link, "pro-1"), false);
  assert.equal(
    isCloudEntitled({
      user_id: "student-1",
      plan: "subscription_monthly",
      status: "active",
      expires_at: null,
      source: "stripe",
    }),
    true,
  );
});

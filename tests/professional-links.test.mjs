import test from "node:test";
import assert from "node:assert/strict";
import {
  canProfessionalManageLink,
  canStudentEdit,
  professionalLimitForPlan,
} from "../src/lib/professional-links.ts";

const activeLink = {
  id: "link-1",
  professional_user_id: "pro-1",
  student_user_id: "student-1",
  status: "active",
  can_student_edit: false,
};

test("only the linked professional can manage an active link", () => {
  assert.equal(canProfessionalManageLink(activeLink, "pro-1"), true);
  assert.equal(canProfessionalManageLink(activeLink, "other-pro"), false);
  assert.equal(canProfessionalManageLink({ ...activeLink, status: "ended" }, "pro-1"), false);
  assert.equal(canProfessionalManageLink({ ...activeLink, status: "revoked" }, "pro-1"), false);
});

test("student editing is locked while active and restored after ending", () => {
  assert.equal(canStudentEdit(activeLink, "student-1"), false);
  assert.equal(canStudentEdit({ ...activeLink, status: "ended" }, "student-1"), true);
  assert.equal(canStudentEdit({ ...activeLink, can_student_edit: true }, "student-1"), true);
  assert.equal(canStudentEdit(activeLink, "other-student"), false);
});

test("professional limits match the commercial plans", () => {
  assert.equal(professionalLimitForPlan("professional_personal"), 10);
  assert.equal(professionalLimitForPlan("professional_personal_pro"), 30);
  assert.equal(professionalLimitForPlan("professional_studio"), 100);
  assert.equal(professionalLimitForPlan("subscription_monthly"), null);
});

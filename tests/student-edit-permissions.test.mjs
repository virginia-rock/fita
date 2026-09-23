import test from "node:test";
import assert from "node:assert/strict";
import { canStudentEdit } from "../src/lib/professional-links.ts";

test("student editing follows the active link lifecycle", () => {
  const link = {
    id: "link-1",
    professional_user_id: "pro-1",
    student_user_id: "student-1",
    status: "active",
    can_student_edit: false,
  };
  assert.equal(canStudentEdit(link, "student-1"), false);
  assert.equal(canStudentEdit({ ...link, status: "ended" }, "student-1"), true);
  assert.equal(canStudentEdit({ ...link, can_student_edit: true }, "student-1"), true);
});

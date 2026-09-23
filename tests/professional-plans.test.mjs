import test from "node:test";
import assert from "node:assert/strict";
import {
  PROFESSIONAL_PLANS,
  canAddProfessionalStudent,
  parseProfessionalPlan,
} from "../src/lib/professional.ts";

test("exposes the three professional plans with their documented limits", () => {
  assert.deepEqual(
    PROFESSIONAL_PLANS.map((plan) => [plan.id, plan.price, plan.studentLimit]),
    [
      ["personal", "R$ 39,90", 10],
      ["personal_pro", "R$ 69,90", 30],
      ["studio", "R$ 149", 100],
    ],
  );
});

test("prevents a professional account from exceeding its student limit", () => {
  assert.equal(canAddProfessionalStudent("personal", 9), true);
  assert.equal(canAddProfessionalStudent("personal", 10), false);
  assert.equal(canAddProfessionalStudent("studio", 99), true);
  assert.equal(canAddProfessionalStudent("studio", 100), false);
});

test("rejects unknown professional plans", () => {
  assert.equal(parseProfessionalPlan("personal_pro"), "personal_pro");
  assert.equal(parseProfessionalPlan("subscription"), null);
});

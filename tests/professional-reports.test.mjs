import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStudentReport,
  canGenerateProfessionalReport,
} from "../src/lib/professional-reports.ts";

test("reports are available only to Personal Pro and Studio", () => {
  assert.equal(canGenerateProfessionalReport("professional_personal"), false);
  assert.equal(canGenerateProfessionalReport("professional_personal_pro"), true);
  assert.equal(canGenerateProfessionalReport("professional_studio"), true);
});

test("builds current, previous and metric variation data", () => {
  const report = buildStudentReport(
    {
      entries: [{ id: "2", date: "2026-09-20", values: { peso: 80, cintura: 90 }, note: "Atual" }],
    },
    { entries: [{ id: "1", date: "2026-09-01", values: { peso: 82, cintura: 94 } }] },
  );
  assert.equal(report.current.date, "2026-09-20");
  assert.equal(report.previous.date, "2026-09-01");
  assert.deepEqual(report.variations, { peso: -2, cintura: -4 });
  assert.equal(report.observations, "Atual");
});

import test from "node:test";
import assert from "node:assert/strict";

const { insiderOfferCopy, insiderTrialLabel } = await import("../src/lib/insider-presentation.ts");

test("describes the selected Insider offer and its active trial", () => {
  assert.equal(insiderOfferCopy("pro_monthly"), "Fita Pro mensal Insider");
  assert.equal(insiderOfferCopy("personal"), "Fita Personal Insider");
  assert.equal(
    insiderTrialLabel("2026-12-24T12:00:00.000Z", new Date("2026-09-24T12:00:00.000Z")),
    "Teste até 24/12/2026",
  );
  assert.equal(insiderTrialLabel("2026-09-23T12:00:00.000Z", new Date("2026-09-24T12:00:00.000Z")), null);
});

import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("professional dashboard is wired to invitation and student-link operations", async () => {
  const source = await readFile("src/routes/profissional.tsx", "utf8");
  for (const operation of [
    "createProfessionalInvitation",
    "listProfessionalStudents",
    "Gerar relatório",
  ]) {
    assert.match(source, new RegExp(operation.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")));
  }
});

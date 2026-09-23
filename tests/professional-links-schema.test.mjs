import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("professional link schema protects ownership and active-link limits", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/20260923000002_create_professional_links.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /references auth\.users/gi);
  assert.match(sql, /status in \('pending', 'active', 'ended', 'revoked'\)/i);
  assert.match(sql, /professional_user_id <> student_user_id/i);
  assert.match(sql, /unique index .*active/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /auth\.uid\(\)/i);
  for (const functionName of [
    "create_professional_invitation",
    "accept_professional_invitation",
    "end_professional_link",
    "leave_professional_link",
    "list_professional_students",
    "get_professional_student_workspace",
    "add_professional_evaluation",
  ]) {
    assert.match(sql, new RegExp(`function public\\.${functionName}`));
  }
});

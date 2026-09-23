import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeInvitationEmail,
  professionalLinkErrorMessage,
} from "../src/lib/professional-link-api.ts";

test("normalizes invitation email before sending it to Supabase", () => {
  assert.equal(normalizeInvitationEmail("  ALUNO@EXAMPLE.COM "), "aluno@example.com");
  assert.throws(() => normalizeInvitationEmail("not-an-email"), /e-mail/i);
});

test("returns safe messages for link API failures", () => {
  assert.match(professionalLinkErrorMessage(new Error("permission denied")), /permissão/i);
  assert.match(professionalLinkErrorMessage("unknown"), /vínculo/i);
});

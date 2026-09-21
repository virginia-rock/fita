import test from "node:test";
import assert from "node:assert/strict";

const { validateLogin, validateSignup } = await import("../src/lib/auth-validation.ts");

test("rejects signup when passwords do not match", () => {
  assert.deepEqual(validateSignup("person@example.com", "secret123", "secret321"), {
    email: "",
    password: "",
    confirmPassword: "As senhas precisam ser iguais.",
  });
});

test("rejects login with an invalid email", () => {
  assert.deepEqual(validateLogin("not-an-email", "secret123"), {
    email: "Informe um e-mail válido.",
    password: "",
  });
});

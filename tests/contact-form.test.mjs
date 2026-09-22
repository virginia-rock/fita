import test from "node:test";
import assert from "node:assert/strict";
import { buildContactMailto, validateContactForm } from "../src/lib/contact.ts";

test("valida nome, email e descrição como campos obrigatórios", () => {
  assert.deepEqual(validateContactForm({ name: "", email: "", company: "", whatsapp: "", description: "" }), {
    name: "Informe seu nome.",
    email: "Informe seu e-mail.",
    description: "Conte um pouco sobre o grupo.",
  });
});

test("aceita os campos obrigatórios e retorna nenhuma mensagem de erro", () => {
  assert.deepEqual(
    validateContactForm({
      name: "Carlo",
      email: "carlo@example.com",
      company: "Fita",
      whatsapp: "11999999999",
      description: "Quero contratar para 20 pessoas.",
    }),
    {},
  );
});

test("monta o link de e-mail com os dados preenchidos", () => {
  const mailto = buildContactMailto({
    name: "Carlo",
    email: "carlo@example.com",
    company: "Fita",
    whatsapp: "11999999999",
    description: "Quero contratar para 20 pessoas.",
  });

  assert.match(mailto, /^mailto:carlospessin@gmail\.com\?/);
  assert.match(mailto, /subject=Contato%20sobre%20contrata%C3%A7%C3%A3o%20em%20grupo/);
  assert.match(mailto, /carlo%40example\.com/);
  assert.match(mailto, /Quero%20contratar%20para%2020%20pessoas/);
});

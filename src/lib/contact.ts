export type ContactFormData = {
  name: string;
  email: string;
  company: string;
  whatsapp: string;
  description: string;
};

export type ContactFormErrors = Partial<Record<keyof ContactFormData, string>>;

export function validateContactForm(data: ContactFormData): ContactFormErrors {
  const errors: ContactFormErrors = {};

  if (!data.name.trim()) errors.name = "Informe seu nome.";
  if (!data.email.trim()) {
    errors.email = "Informe seu e-mail.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Confira o formato do seu e-mail.";
  }
  if (!data.description.trim()) errors.description = "Conte um pouco sobre o grupo.";

  return errors;
}

export function buildContactMailto(data: ContactFormData) {
  const body = [
    `Nome: ${data.name.trim()}`,
    `E-mail: ${data.email.trim()}`,
    `Empresa: ${data.company.trim() || "Não informado"}`,
    `WhatsApp: ${data.whatsapp.trim() || "Não informado"}`,
    "",
    "Descrição:",
    data.description.trim(),
  ].join("\n");

  return [
    `subject=${encodeURIComponent("Contato sobre contratação em grupo")}`,
    `body=${encodeURIComponent(body)}`,
  ].join("&").replace(/^/, "mailto:carlospessin@gmail.com?");
}

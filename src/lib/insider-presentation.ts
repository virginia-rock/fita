import type { InsiderAccess } from "./insider";

export function insiderOfferCopy(offer: InsiderAccess["offer"]) {
  return offer === "personal" ? "Fita Personal Insider" : "Fita Pro mensal Insider";
}

export function insiderTrialLabel(trialEndsAt: string | null | undefined, now = new Date()) {
  if (!trialEndsAt) return null;
  const date = new Date(trialEndsAt);
  if (Number.isNaN(date.getTime()) || date <= now) return null;
  return `Teste até ${date.toLocaleDateString("pt-BR")}`;
}

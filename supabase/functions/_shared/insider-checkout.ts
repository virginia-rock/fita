export type InsiderCheckoutOffer = "pro_monthly" | "personal";

export function insiderCheckoutConfig(offer: unknown) {
  if (offer === "pro_monthly") {
    return {
      envName: "FITA_PRO_MONTHLY_INSIDER",
      plan: "subscription_monthly" as const,
      trialPeriodDays: 90,
    };
  }
  if (offer === "personal") {
    return {
      envName: "FITA_PERSONAL_INSIDER",
      plan: "professional_personal" as const,
      trialPeriodDays: 90,
    };
  }
  return null;
}

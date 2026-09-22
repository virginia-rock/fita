export type PaidPlan = "cloud_month" | "subscription";

type StripeEnv = Record<string, string | undefined>;

export function parsePaidPlan(value: unknown): PaidPlan | null {
  if (value === "cloud_month" || value === "subscription") return value;
  return null;
}

export function priceIdForPlan(plan: PaidPlan, env: StripeEnv): string {
  const priceId =
    plan === "cloud_month" ? env.STRIPE_PRICE_CLOUD_MONTH : env.STRIPE_PRICE_SUBSCRIPTION;

  if (!priceId?.trim()) {
    throw new Error(`Stripe Price ID is not configured for ${plan}.`);
  }

  return priceId;
}

export function planForPriceId(priceId: string, env: StripeEnv): PaidPlan | null {
  const cloudMonth = env.STRIPE_PRICE_CLOUD_MONTH?.trim();
  const subscription = env.STRIPE_PRICE_SUBSCRIPTION?.trim();

  if (!cloudMonth || !subscription || cloudMonth === subscription) return null;
  if (priceId === cloudMonth) return "cloud_month";
  if (priceId === subscription) return "subscription";
  return null;
}

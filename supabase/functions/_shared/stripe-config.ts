export type PaidPlan =
  | "cloud_month"
  | "subscription"
  | "subscription_monthly"
  | "subscription_annual"
  | "professional_personal"
  | "professional_personal_pro"
  | "professional_studio";

export type InsiderOffer = "pro_monthly" | "personal";
export type StripePriceConfig = {
  plan: PaidPlan;
  insiderOffer: InsiderOffer | null;
};

type StripeEnv = Record<string, string | undefined>;

export function parsePaidPlan(value: unknown): PaidPlan | null {
  if (
    value === "cloud_month" ||
    value === "subscription" ||
    value === "subscription_monthly" ||
    value === "subscription_annual" ||
    value === "professional_personal" ||
    value === "professional_personal_pro" ||
    value === "professional_studio"
  )
    return value;
  return null;
}

const priceEnvByPlan: Record<PaidPlan, string> = {
  cloud_month: "STRIPE_PRICE_CLOUD_MONTH",
  subscription: "STRIPE_PRICE_SUBSCRIPTION",
  subscription_monthly: "FITA_PRO_MONTHLY",
  subscription_annual: "FITA_PRO_ANNUAL",
  professional_personal: "FITA_PERSONAL",
  professional_personal_pro: "FITA_PERSONAL_PRO",
  professional_studio: "FITA_STUDIO",
};

const insiderPriceConfigs: Array<{ envName: string; config: StripePriceConfig }> = [
  {
    envName: "FITA_PRO_MONTHLY_INSIDER",
    config: { plan: "subscription_monthly", insiderOffer: "pro_monthly" },
  },
  {
    envName: "FITA_PERSONAL_INSIDER",
    config: { plan: "professional_personal", insiderOffer: "personal" },
  },
];

export function isSubscriptionPlan(plan: PaidPlan) {
  return plan !== "cloud_month";
}

export function priceIdForPlan(plan: PaidPlan, env: StripeEnv): string {
  const priceId = env[priceEnvByPlan[plan]];

  if (!priceId?.trim()) {
    throw new Error(`Stripe Price ID is not configured for ${plan}.`);
  }

  return priceId;
}

export function planForPriceId(priceId: string, env: StripeEnv): PaidPlan | null {
  return priceConfigForId(priceId, env)?.plan ?? null;
}

export function priceConfigForId(priceId: string, env: StripeEnv): StripePriceConfig | null {
  const configured = [
    ...(Object.keys(priceEnvByPlan) as PaidPlan[]).map((plan) => ({
      priceId: env[priceEnvByPlan[plan]]?.trim(),
      config: { plan, insiderOffer: null } satisfies StripePriceConfig,
    })),
    ...insiderPriceConfigs.map(({ envName, config }) => ({
      priceId: env[envName]?.trim(),
      config,
    })),
  ].filter((entry): entry is { priceId: string; config: StripePriceConfig } =>
    Boolean(entry.priceId),
  );
  const matching = configured.filter((entry) => entry.priceId === priceId);
  if (matching.length !== 1) return null;
  return matching[0].config;
}

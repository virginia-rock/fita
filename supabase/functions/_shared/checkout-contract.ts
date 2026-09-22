import { parsePaidPlan, type PaidPlan } from "./stripe-config.ts";

export function parseCheckoutRequest(value: unknown): PaidPlan {
  const plan = value && typeof value === "object"
    ? parsePaidPlan((value as Record<string, unknown>).plan)
    : null;

  if (!plan) throw new Error("Invalid paid plan.");
  return plan;
}

export function checkoutMetadata(userId: string, plan: PaidPlan) {
  return {
    supabase_user_id: userId,
    plan,
  };
}

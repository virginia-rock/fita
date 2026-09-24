export type InsiderOffer = "pro_monthly" | "personal";
export type InsiderAccessStatus = "eligible" | "active" | "canceled";

export type InsiderAccess = {
  user_id: string;
  offer: InsiderOffer;
  status: InsiderAccessStatus;
  selected_at: string;
  claimed_at: string | null;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

const offers: InsiderOffer[] = ["pro_monthly", "personal"];
const statuses: InsiderAccessStatus[] = ["eligible", "active", "canceled"];

export function parseInsiderAccess(value: unknown): InsiderAccess | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row["user_id"] !== "string" ||
    !offers.includes(row["offer"] as InsiderOffer) ||
    !statuses.includes(row["status"] as InsiderAccessStatus) ||
    typeof row["selected_at"] !== "string" ||
    (row["claimed_at"] !== null && typeof row["claimed_at"] !== "string") ||
    (row["trial_ends_at"] !== null && typeof row["trial_ends_at"] !== "string") ||
    (row["stripe_customer_id"] !== null && typeof row["stripe_customer_id"] !== "string") ||
    (row["stripe_subscription_id"] !== null && typeof row["stripe_subscription_id"] !== "string")
  ) {
    return null;
  }
  return row as unknown as InsiderAccess;
}

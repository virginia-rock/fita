export type EntitlementPlan = "local" | "cloud_month" | "subscription";
export type EntitlementStatus = "active" | "expired" | "canceled" | "pending";
export type EntitlementSource = "demo" | "stripe";

export type Entitlement = {
  user_id: string;
  plan: EntitlementPlan;
  status: EntitlementStatus;
  expires_at: string | null;
  source: EntitlementSource;
};

const plans: EntitlementPlan[] = ["local", "cloud_month", "subscription"];
const statuses: EntitlementStatus[] = ["active", "expired", "canceled", "pending"];
const sources: EntitlementSource[] = ["demo", "stripe"];

export function parseEntitlement(value: unknown): Entitlement | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.user_id !== "string" ||
    !plans.includes(row.plan as EntitlementPlan) ||
    !statuses.includes(row.status as EntitlementStatus) ||
    !sources.includes(row.source as EntitlementSource) ||
    (row.expires_at !== null && typeof row.expires_at !== "string")
  ) {
    return null;
  }
  return row as unknown as Entitlement;
}

export function isCloudEntitled(entitlement: Entitlement | null, now = new Date()) {
  if (!entitlement || entitlement.status !== "active") return false;
  if (entitlement.plan === "subscription") return true;
  if (entitlement.plan !== "cloud_month" || !entitlement.expires_at) return false;
  const expiresAt = new Date(entitlement.expires_at);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt > now;
}

export const ADMIN_PLAN_FILTERS = [
  "all",
  "free",
  "cloud_month",
  "subscription",
  "subscription_monthly",
  "subscription_annual",
  "professional_personal",
  "professional_personal_pro",
  "professional_studio",
] as const;

export type AdminPlanFilter = (typeof ADMIN_PLAN_FILTERS)[number];
export const ADMIN_PAGE_LIMIT = 50;
export const ADMIN_MAX_PAGE_LIMIT = 100;

type Entitlement = { plan: string; status: string } | null;

export function classifyAdminUser(entitlement: Entitlement): AdminPlanFilter {
  if (
    !entitlement ||
    entitlement.plan === "local" ||
    entitlement.status === "canceled" ||
    entitlement.status === "expired"
  )
    return "free";
  return ADMIN_PLAN_FILTERS.includes(entitlement.plan as AdminPlanFilter) && entitlement.plan !== "all"
    ? (entitlement.plan as AdminPlanFilter)
    : "free";
}

export function parseAdminUsersRequest(value: unknown): {
  plan: AdminPlanFilter;
  page: number;
  limit: number;
} | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    !ADMIN_PLAN_FILTERS.includes(row.plan as AdminPlanFilter) ||
    !Number.isInteger(row.page) ||
    (row.page as number) < 0 ||
    !Number.isInteger(row.limit) ||
    (row.limit as number) < 1 ||
    (row.limit as number) > ADMIN_MAX_PAGE_LIMIT
  )
    return null;
  return { plan: row.plan as AdminPlanFilter, page: row.page as number, limit: row.limit as number };
}

export function emptyAdminCounts() {
  return Object.fromEntries(ADMIN_PLAN_FILTERS.map((plan) => [plan, 0])) as Record<AdminPlanFilter, number>;
}

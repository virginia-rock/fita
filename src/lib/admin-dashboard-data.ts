export const adminPlanFilters = [
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
export type AdminPlanFilter = (typeof adminPlanFilters)[number];
export type AdminDashboard = { counts: Record<AdminPlanFilter, number> };
export type AdminUser = {
  id: string;
  email: string;
  plan: AdminPlanFilter;
  status: string;
  subscribedAt: string | null;
  expiresAt: string | null;
  accountCreatedAt: string;
};
export type AdminUsersPage = { items: AdminUser[]; total: number };
const isCount = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;
export function parseAdminDashboard(value: unknown): AdminDashboard | null {
  if (
    !value ||
    typeof value !== "object" ||
    !("counts" in value) ||
    !value.counts ||
    typeof value.counts !== "object"
  )
    return null;
  const counts = value.counts as Record<string, unknown>;
  return adminPlanFilters.every((plan) => isCount(counts[plan]))
    ? { counts: counts as Record<AdminPlanFilter, number> }
    : null;
}
export function parseAdminUsersPage(value: unknown): AdminUsersPage | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (!Array.isArray(row.items) || !isCount(row.total)) return null;
  const items = row.items as unknown[];
  return items.every((item) => {
    if (!item || typeof item !== "object") return false;
    const user = item as Record<string, unknown>;
    return (
      typeof user.id === "string" &&
      typeof user.email === "string" &&
      adminPlanFilters.includes(user.plan as AdminPlanFilter) &&
      typeof user.status === "string" &&
      (user.subscribedAt === null || typeof user.subscribedAt === "string") &&
      (user.expiresAt === null || typeof user.expiresAt === "string") &&
      typeof user.accountCreatedAt === "string"
    );
  })
    ? { items: items as AdminUser[], total: row.total as number }
    : null;
}

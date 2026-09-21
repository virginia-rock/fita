export const DEMO_ACCOUNT_KEY = "fita.demo-account";

export type DemoPlan = "local" | "cloud_month" | "subscription";
export type DemoStatus = "anonymous" | "pending" | "active" | "expired" | "canceled";

export type DemoAccount = {
  id: string;
  email: string;
  emailConfirmed: boolean;
  plan: DemoPlan;
  status: DemoStatus;
  createdAt: string;
  expiresAt?: string;
  demoPassword?: string;
};

const isPlan = (value: unknown): value is DemoPlan =>
  value === "local" || value === "cloud_month" || value === "subscription";

const isStatus = (value: unknown): value is DemoStatus =>
  value === "anonymous" ||
  value === "pending" ||
  value === "active" ||
  value === "expired" ||
  value === "canceled";

export function createDemoAccount(
  email: string,
  idFactory = () => crypto.randomUUID(),
  demoPassword?: string,
): DemoAccount {
  const account: DemoAccount = {
    id: idFactory(),
    email: email.trim().toLowerCase(),
    emailConfirmed: false,
    plan: "local",
    status: "anonymous",
    createdAt: new Date().toISOString(),
  };

  if (demoPassword) account.demoPassword = demoPassword;
  return account;
}

export function parseDemoAccount(value: string | null): DemoAccount | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;

    const account = parsed as Record<string, unknown>;
    if (
      typeof account["id"] !== "string" ||
      typeof account["email"] !== "string" ||
      typeof account["emailConfirmed"] !== "boolean" ||
      !isPlan(account["plan"]) ||
      !isStatus(account["status"]) ||
      typeof account["createdAt"] !== "string" ||
      (account["expiresAt"] !== undefined && typeof account["expiresAt"] !== "string") ||
      (account["demoPassword"] !== undefined && typeof account["demoPassword"] !== "string")
    ) {
      return null;
    }

    return account as unknown as DemoAccount;
  } catch {
    return null;
  }
}

export function loadDemoAccount(): DemoAccount | null {
  if (typeof window === "undefined") return null;
  return parseDemoAccount(window.localStorage.getItem(DEMO_ACCOUNT_KEY));
}

export function saveDemoAccount(account: DemoAccount) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DEMO_ACCOUNT_KEY, JSON.stringify(account));
  }
}

export function setDemoSession(account: DemoAccount) {
  saveDemoAccount(account);
}

export function loadDemoSession() {
  return loadDemoAccount();
}

export function clearDemoAccount() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(DEMO_ACCOUNT_KEY);
  }
}

export function activateDemoPlan(
  account: DemoAccount,
  plan: Exclude<DemoPlan, "local">,
  now = new Date(),
): DemoAccount {
  if (plan === "cloud_month") {
    const expiresAt = new Date(now);
    expiresAt.setUTCDate(expiresAt.getUTCDate() + 30);
    return { ...account, plan, status: "active", expiresAt: expiresAt.toISOString() };
  }

  const { expiresAt: _expiresAt, ...withoutExpiry } = account;
  return { ...withoutExpiry, plan, status: "active" };
}

export function cancelDemoSubscription(account: DemoAccount): DemoAccount {
  if (account.plan !== "subscription") return account;
  return { ...account, status: "canceled" };
}

export function hasDemoCloudAccess(account: DemoAccount | null, now = new Date()) {
  if (!account || account.status !== "active") return false;
  if (account.plan === "subscription") return true;
  return Boolean(account.expiresAt && new Date(account.expiresAt) > now);
}

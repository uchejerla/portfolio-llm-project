export type AccountIntent = "account" | "signin" | "upgrade";

export interface AccountUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  trialEndsAt: number;
  createdAt: number;
}

export type AccountPlan = "trial" | "pro" | "expired" | "free";

export interface AccountAccess {
  plan: AccountPlan;
  canGenerate: boolean;
  trialDaysLeft: number;
  trialEndsAt: number;
  subscriptionStatus: string;
  currentPeriodEnd: number | null;
  manageBilling: boolean;
}

export interface AccountState {
  authEnabled: boolean;
  billingEnabled: boolean;
  trialDays: number;
  portfolioTrialDays: number;
  priceLabel: string;
  user: AccountUser | null;
  access: AccountAccess | null;
}

function readUser(value: unknown): AccountUser | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || typeof raw.email !== "string") return null;
  return {
    id: raw.id,
    email: raw.email,
    name: typeof raw.name === "string" ? raw.name : "",
    avatarUrl: typeof raw.avatarUrl === "string" ? raw.avatarUrl : "",
    trialEndsAt: typeof raw.trialEndsAt === "number" ? raw.trialEndsAt : 0,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : 0,
  };
}

function readAccess(value: unknown): AccountAccess | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.plan !== "trial" && raw.plan !== "pro" && raw.plan !== "expired" && raw.plan !== "free") {
    return null;
  }
  return {
    plan: raw.plan,
    canGenerate: raw.canGenerate === true,
    trialDaysLeft: typeof raw.trialDaysLeft === "number" ? raw.trialDaysLeft : 0,
    trialEndsAt: typeof raw.trialEndsAt === "number" ? raw.trialEndsAt : 0,
    subscriptionStatus: typeof raw.subscriptionStatus === "string" ? raw.subscriptionStatus : "none",
    currentPeriodEnd: typeof raw.currentPeriodEnd === "number" ? raw.currentPeriodEnd : null,
    manageBilling: raw.manageBilling === true,
  };
}

export async function fetchAccount(): Promise<AccountState | null> {
  try {
    const response = await fetch("/api/me", { headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, unknown>;
    if (!data || typeof data !== "object") return null;
    return {
      authEnabled: data.authEnabled === true,
      billingEnabled: data.billingEnabled === true,
      trialDays: typeof data.trialDays === "number" ? data.trialDays : 7,
      portfolioTrialDays:
        typeof data.portfolioTrialDays === "number" ? data.portfolioTrialDays : 14,
      priceLabel: typeof data.priceLabel === "string" ? data.priceLabel : "$9 / month",
      user: readUser(data.user),
      access: readAccess(data.access),
    };
  } catch {
    return null;
  }
}

async function postAccount<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { accept: "application/json" },
  });
  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    // The generic message below is enough.
  }
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "The account request could not be completed.",
    );
  }
  return data as T;
}

export async function startAccountCheckout(): Promise<string> {
  const data = await postAccount<{ url?: unknown }>("/api/billing/checkout");
  if (typeof data.url !== "string" || !data.url) {
    throw new Error("Stripe did not return a checkout link.");
  }
  return data.url;
}

export async function openAccountPortal(): Promise<string> {
  const data = await postAccount<{ url?: unknown }>("/api/billing/portal");
  if (typeof data.url !== "string" || !data.url) {
    throw new Error("Stripe did not return a billing link.");
  }
  return data.url;
}

export async function signOutAccount(): Promise<void> {
  await postAccount<{ ok: boolean }>("/api/auth/logout");
}

export function accountName(account: AccountState | null): string {
  if (!account?.authEnabled) return "Local workspace";
  if (!account.user) return "Sign in with Google";
  return account.user.name || account.user.email;
}

export function accountDetail(account: AccountState | null): string {
  if (!account?.authEnabled) return "Saved on this device";
  if (!account.user) return "Start your free trial";
  if (account.access?.plan === "pro") return "Studio Pro · active";
  if (account.access?.plan === "trial") {
    const days = account.access.trialDaysLeft;
    return `Free trial · ${days} ${days === 1 ? "day" : "days"} left`;
  }
  if (account.access?.plan === "expired") return "Trial ended · upgrade";
  return "Self-hosted studio";
}

export function accountPlanLabel(account: AccountState | null): string | null {
  if (!account?.authEnabled) return null;
  if (!account.user) return "Sign in";
  if (account.access?.plan === "pro") return "Pro";
  if (account.access?.plan === "trial") {
    const days = account.access.trialDaysLeft;
    return `${days}d left`;
  }
  if (account.access?.plan === "expired") return "Upgrade";
  return "Local";
}

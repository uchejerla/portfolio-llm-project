import type { StudioConfig } from "./config";
import type { Database, UserRecord } from "./db/types";
import {
  SESSION_COOKIE,
  readCookie,
  sha256Hex,
  randomToken,
  SESSION_DAYS,
} from "./http";

export const DAY_MS = 24 * 60 * 60 * 1000;

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export type AccountPlan = "trial" | "pro" | "expired" | "free";

export interface AccessState {
  plan: AccountPlan;
  canGenerate: boolean;
  trialDaysLeft: number;
  trialEndsAt: number;
  subscriptionStatus: string;
  currentPeriodEnd: number | null;
  manageBilling: boolean;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  trialEndsAt: number;
  createdAt: number;
}

export function accessFor(user: UserRecord, config: StudioConfig, now = Date.now()): AccessState {
  const status = user.subscription_status || "none";
  const activeSubscription = status === "active" || status === "trialing";
  const paidThrough =
    user.current_period_end !== null &&
    user.current_period_end > now &&
    (status === "canceled" || status === "past_due");

  const trialDaysLeft = Math.max(0, Math.ceil((user.trial_ends_at - now) / DAY_MS));

  let plan: AccountPlan;
  let canGenerate: boolean;
  if (activeSubscription || paidThrough) {
    plan = "pro";
    canGenerate = true;
  } else if (!config.billingEnabled) {
    // Self-hosted clones have no way to buy a plan, so the paywall stays off.
    plan = "free";
    canGenerate = true;
  } else if (user.trial_ends_at > now) {
    plan = "trial";
    canGenerate = true;
  } else {
    plan = "expired";
    canGenerate = false;
  }

  return {
    plan,
    canGenerate,
    trialDaysLeft,
    trialEndsAt: user.trial_ends_at,
    subscriptionStatus: status,
    currentPeriodEnd: user.current_period_end,
    manageBilling: Boolean(user.stripe_customer_id) && config.billingEnabled,
  };
}

export function publicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    trialEndsAt: user.trial_ends_at,
    createdAt: user.created_at,
  };
}

export async function ensureUser(
  db: Database,
  profile: GoogleProfile,
  trialDays: number,
): Promise<UserRecord> {
  const now = Date.now();
  const existing = await db.first<UserRecord>(
    "SELECT * FROM users WHERE google_sub = ?",
    profile.sub,
  );

  if (existing) {
    if (
      existing.email !== profile.email ||
      existing.name !== profile.name ||
      existing.avatar_url !== profile.avatarUrl
    ) {
      await db.run(
        "UPDATE users SET email = ?, name = ?, avatar_url = ?, updated_at = ? WHERE id = ?",
        profile.email,
        profile.name,
        profile.avatarUrl,
        now,
        existing.id,
      );
      return {
        ...existing,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.avatarUrl,
        updated_at: now,
      };
    }
    return existing;
  }

  const id = crypto.randomUUID();
  await db.run(
    `INSERT OR IGNORE INTO users
      (id, google_sub, email, name, avatar_url, trial_ends_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    profile.sub,
    profile.email,
    profile.name,
    profile.avatarUrl,
    now + trialDays * DAY_MS,
    now,
    now,
  );

  const created = await db.first<UserRecord>(
    "SELECT * FROM users WHERE google_sub = ?",
    profile.sub,
  );
  if (!created) throw new Error("Could not create the user record.");
  return created;
}

export async function createSession(db: Database, userId: string): Promise<string> {
  const now = Date.now();
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  await db.run("DELETE FROM sessions WHERE expires_at <= ?", now);
  await db.run(
    "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    tokenHash,
    userId,
    now + SESSION_DAYS * DAY_MS,
    now,
  );
  return token;
}

export async function getSessionUser(
  request: Request,
  db: Database | null,
): Promise<UserRecord | null> {
  if (!db) return null;
  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  return db.first<UserRecord>(
    `SELECT u.* FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?`,
    tokenHash,
    Date.now(),
  );
}

export async function deleteCurrentSession(request: Request, db: Database): Promise<void> {
  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (!token) return;
  await db.run("DELETE FROM sessions WHERE token_hash = ?", await sha256Hex(token));
}

export async function findUserByStripeCustomer(
  db: Database,
  customerId: string,
): Promise<UserRecord | null> {
  return db.first<UserRecord>("SELECT * FROM users WHERE stripe_customer_id = ?", customerId);
}

export async function attachStripeCustomer(
  db: Database,
  userId: string,
  customerId: string,
): Promise<void> {
  await db.run(
    "UPDATE users SET stripe_customer_id = ?, updated_at = ? WHERE id = ?",
    customerId,
    Date.now(),
    userId,
  );
}

export async function markCheckoutComplete(
  db: Database,
  input: { userId: string; customerId: string; subscriptionId: string },
): Promise<void> {
  await db.run(
    `UPDATE users SET stripe_customer_id = ?, stripe_subscription_id = ?,
      subscription_status = 'active', updated_at = ? WHERE id = ?`,
    input.customerId,
    input.subscriptionId,
    Date.now(),
    input.userId,
  );
}

export async function saveSubscription(
  db: Database,
  input: {
    userId: string;
    customerId: string | null;
    subscriptionId: string | null;
    status: string;
    currentPeriodEnd: number | null;
  },
): Promise<void> {
  await db.run(
    `UPDATE users SET stripe_customer_id = COALESCE(?, stripe_customer_id),
      stripe_subscription_id = ?, subscription_status = ?, current_period_end = ?, updated_at = ?
      WHERE id = ?`,
    input.customerId,
    input.subscriptionId,
    input.status,
    input.currentPeriodEnd,
    Date.now(),
    input.userId,
  );
}

export async function markPaymentFailed(
  db: Database,
  input: { customerId: string | null; subscriptionId: string | null },
): Promise<void> {
  if (!input.customerId && !input.subscriptionId) return;
  await db.run(
    `UPDATE users SET subscription_status = 'past_due', updated_at = ?
      WHERE (stripe_customer_id = ? AND ? IS NOT NULL)
        OR (stripe_subscription_id = ? AND ? IS NOT NULL)`,
    Date.now(),
    input.customerId,
    input.customerId,
    input.subscriptionId,
    input.subscriptionId,
  );
}

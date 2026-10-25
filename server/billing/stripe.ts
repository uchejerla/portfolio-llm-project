import type { StripeConfig } from "../config";
import type { Database, UserRecord } from "../db/types";
import {
  attachStripeCustomer,
  findUserByStripeCustomer,
  markCheckoutComplete,
  markPaymentFailed,
  saveSubscription,
} from "../account";
import { constantTimeEqual } from "../http";

const STRIPE_API = "https://api.stripe.com/v1";
const STRIPE_VERSION = "2024-06-20";
const SIGNATURE_TOLERANCE_SECONDS = 300;

export class StripeError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function seconds(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value * 1000 : null;
}

function idOf(value: unknown): string | null {
  if (typeof value === "string") return value || null;
  return text(record(value).id);
}

async function stripePost<T>(
  config: StripeConfig,
  path: string,
  params: URLSearchParams,
): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.secretKey}`,
      "content-type": "application/x-www-form-urlencoded",
      "stripe-version": STRIPE_VERSION,
    },
    body: params.toString(),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const detail = record(payload.error).message;
    console.error(
      "Stripe request failed",
      path,
      response.status,
      typeof detail === "string" ? detail.slice(0, 300) : "",
    );
    throw new StripeError("Stripe rejected the billing request.", response.status);
  }
  return payload as T;
}

export async function ensureStripeCustomer(
  config: StripeConfig,
  user: UserRecord,
  db: Database,
): Promise<string> {
  if (user.stripe_customer_id) return user.stripe_customer_id;

  const params = new URLSearchParams();
  params.set("email", user.email);
  if (user.name) params.set("name", user.name);
  params.set("metadata[user_id]", user.id);
  const customer = await stripePost<{ id: string }>(config, "/customers", params);
  await attachStripeCustomer(db, user.id, customer.id);
  return customer.id;
}

export async function createCheckoutSession(
  config: StripeConfig,
  user: UserRecord,
  customerId: string,
  origin: string,
): Promise<string> {
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("customer", customerId);
  params.append("line_items[0][price]", config.priceId);
  params.append("line_items[0][quantity]", "1");
  params.set("success_url", `${origin}/?billing=success`);
  params.set("cancel_url", `${origin}/?billing=cancel`);
  params.set("client_reference_id", user.id);
  params.set("metadata[user_id]", user.id);
  params.set("subscription_data[metadata][user_id]", user.id);
  params.set("allow_promotion_codes", "true");
  params.set("billing_address_collection", "auto");

  const session = await stripePost<{ id: string; url: string | null }>(
    config,
    "/checkout/sessions",
    params,
  );
  if (!session.url) throw new StripeError("Stripe did not return a checkout URL.", 502);
  return session.url;
}

export async function createPortalSession(
  config: StripeConfig,
  customerId: string,
  origin: string,
): Promise<string> {
  const params = new URLSearchParams();
  params.set("customer", customerId);
  params.set("return_url", `${origin}/?billing=portal`);
  const session = await stripePost<{ url: string | null }>(config, "/billing_portal/sessions", params);
  if (!session.url) throw new StripeError("Stripe did not return a portal URL.", 502);
  return session.url;
}

async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Verifies the Stripe-Signature header over the exact raw request body. */
export async function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  now = Date.now(),
): Promise<boolean> {
  if (!header || !secret) return false;
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key === "t") timestamp = Number.parseInt(value, 10);
    else if (key === "v1" && value) signatures.push(value);
  }
  if (timestamp === null || !Number.isFinite(timestamp) || !signatures.length) return false;
  if (Math.abs(now / 1000 - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = await sign(secret, `${timestamp}.${payload}`);
  return signatures.some((candidate) => constantTimeEqual(candidate, expected));
}

function currentPeriodEnd(subscription: Record<string, unknown>): number | null {
  const direct = seconds(subscription.current_period_end);
  if (direct !== null) return direct;
  const items = record(subscription.items);
  const first = Array.isArray(items.data) ? record(items.data[0]) : {};
  return seconds(first.current_period_end);
}

async function userFor(
  db: Database,
  userId: string | null,
  customerId: string | null,
): Promise<UserRecord | null> {
  if (userId) {
    const byId = await db.first<UserRecord>("SELECT * FROM users WHERE id = ?", userId);
    if (byId) return byId;
  }
  if (customerId) return findUserByStripeCustomer(db, customerId);
  return null;
}

/** Applies the subscription events that matter to access. Safe to retry. */
export async function processStripeEvent(event: StripeEvent, db: Database): Promise<void> {
  const object = record(event.data.object);

  if (event.type === "checkout.session.completed") {
    const userId = text(object.client_reference_id) ?? text(record(object.metadata).user_id);
    const customerId = idOf(object.customer);
    const subscriptionId = idOf(object.subscription);
    if (!userId || !customerId || !subscriptionId) return;
    await markCheckoutComplete(db, { userId, customerId, subscriptionId });
    return;
  }

  if (event.type.startsWith("customer.subscription.")) {
    const userId = text(record(object.metadata).user_id);
    const customerId = idOf(object.customer);
    const user = await userFor(db, userId, customerId);
    if (!user) return;
    const status =
      event.type === "customer.subscription.deleted"
        ? "canceled"
        : text(object.status) ?? "none";
    await saveSubscription(db, {
      userId: user.id,
      customerId,
      subscriptionId: idOf(object.id),
      status,
      currentPeriodEnd: currentPeriodEnd(object),
    });
    return;
  }

  if (event.type === "invoice.payment_failed") {
    await markPaymentFailed(db, {
      customerId: idOf(object.customer),
      subscriptionId: idOf(object.subscription),
    });
  }
}

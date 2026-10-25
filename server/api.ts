import type { AccountEnv, StudioConfig } from "./config";
import { publicAccountConfig, readConfig } from "./config";
import type { Database, UserRecord } from "./db/types";
import {
  accessFor,
  deleteCurrentSession,
  getSessionUser,
  publicUser,
} from "./account";
import { finishGoogleAuth, startGoogleAuth } from "./auth/google";
import {
  createCheckoutSession,
  createPortalSession,
  ensureStripeCustomer,
  processStripeEvent,
  verifyStripeSignature,
  type StripeEvent,
} from "./billing/stripe";
import {
  clearSessionCookie,
  isSameOrigin,
  json,
  methodNotAllowed,
} from "./http";
import type { ProviderEnv } from "./providers";
import { resolveProvider } from "./providers";

export type ApiEnv = ProviderEnv & AccountEnv;

const MAX_WEBHOOK_BODY = 500_000;

function requireDatabase(db: Database | null): Response | null {
  return db ? null : json({ error: "Accounts are temporarily unavailable." }, 503);
}

function requireUser(
  request: Request,
  db: Database,
): Promise<UserRecord | null> {
  return getSessionUser(request, db);
}

function accountPayload(
  config: StudioConfig,
  user: UserRecord | null,
): Record<string, unknown> {
  return {
    ...publicAccountConfig(config),
    user: user ? publicUser(user) : null,
    access: user ? accessFor(user, config) : null,
  };
}

async function handleMe(
  request: Request,
  config: StudioConfig,
  db: Database | null,
): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed("GET");
  if (!config.authEnabled) return json(accountPayload(config, null));
  if (!db) return json({ error: "Accounts are temporarily unavailable." }, 503);
  const user = await requireUser(request, db);
  return json(accountPayload(config, user));
}

async function handleCheckout(
  request: Request,
  config: StudioConfig,
  db: Database | null,
): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed("POST");
  if (!isSameOrigin(request)) return json({ error: "Cross-origin request blocked." }, 403);
  if (!config.billingEnabled || !config.stripe) {
    return json({ error: "Billing is not configured on this deployment." }, 503);
  }
  if (!db) return requireDatabase(db) as Response;
  const user = await requireUser(request, db);
  if (!user) {
    return json(
      { error: "Sign in with Google before starting a subscription.", code: "auth_required" },
      401,
    );
  }
  if (accessFor(user, config).plan === "pro") {
    return json({ error: "You already have an active plan." }, 409);
  }

  try {
    const customerId = await ensureStripeCustomer(config.stripe, user, db);
    const url = await createCheckoutSession(
      config.stripe,
      user,
      customerId,
      new URL(request.url).origin,
    );
    return json({ url });
  } catch (error) {
    console.error("Checkout could not be started", error);
    return json({ error: "Could not start checkout. Try again in a moment." }, 502);
  }
}

async function handlePortal(
  request: Request,
  config: StudioConfig,
  db: Database | null,
): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed("POST");
  if (!isSameOrigin(request)) return json({ error: "Cross-origin request blocked." }, 403);
  if (!config.billingEnabled || !config.stripe) {
    return json({ error: "Billing is not configured on this deployment." }, 503);
  }
  if (!db) return requireDatabase(db) as Response;
  const user = await requireUser(request, db);
  if (!user) {
    return json({ error: "Sign in to manage billing.", code: "auth_required" }, 401);
  }
  if (!user.stripe_customer_id) {
    return json({ error: "There is no billing account yet. Start a plan first." }, 400);
  }

  try {
    const url = await createPortalSession(
      config.stripe,
      user.stripe_customer_id,
      new URL(request.url).origin,
    );
    return json({ url });
  } catch (error) {
    console.error("Billing portal could not be opened", error);
    return json({ error: "Could not open the billing portal. Try again in a moment." }, 502);
  }
}

async function handleStripeWebhook(
  request: Request,
  config: StudioConfig,
  db: Database | null,
): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed("POST");
  if (!config.stripe) return json({ error: "Billing is not configured." }, 503);
  if (!db) return requireDatabase(db) as Response;

  const payload = await request.text();
  if (payload.length > MAX_WEBHOOK_BODY) {
    return json({ error: "Webhook payload is too large." }, 413);
  }
  const valid = await verifyStripeSignature(
    payload,
    request.headers.get("stripe-signature"),
    config.stripe.webhookSecret,
  );
  if (!valid) return json({ error: "Invalid Stripe signature." }, 400);

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return json({ error: "Invalid webhook JSON." }, 400);
  }
  const event = parsed as Partial<StripeEvent>;
  if (
    !event ||
    typeof event.id !== "string" ||
    typeof event.type !== "string" ||
    !event.data ||
    typeof event.data.object !== "object" ||
    event.data.object === null
  ) {
    return json({ error: "Invalid Stripe event." }, 400);
  }

  const seen = await db.first<{ id: string }>(
    "SELECT id FROM billing_events WHERE id = ?",
    event.id,
  );
  if (seen) return json({ received: true });

  await db.run(
    "INSERT INTO billing_events (id, type, created_at) VALUES (?, ?, ?)",
    event.id,
    event.type,
    Date.now(),
  );

  try {
    await processStripeEvent(event as StripeEvent, db);
  } catch (error) {
    await db.run("DELETE FROM billing_events WHERE id = ?", event.id);
    console.error("Stripe webhook processing failed", error);
    return json({ error: "Webhook processing failed." }, 500);
  }
  return json({ received: true });
}

async function handleLogout(request: Request, db: Database | null): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed("POST");
  if (!isSameOrigin(request)) return json({ error: "Cross-origin request blocked." }, 403);
  if (!db) return requireDatabase(db) as Response;
  await deleteCurrentSession(request, db);
  const response = json({ ok: true });
  response.headers.append("set-cookie", clearSessionCookie(request));
  return response;
}

/**
 * Handles every API route except `/api/chat`, which needs its own streaming
 * transport in Node and Workers. Returns null for that route and non-API paths.
 */
export async function handleApi(
  request: Request,
  env: ApiEnv,
  db: Database | null,
): Promise<Response | null> {
  const url = new URL(request.url);
  const config = readConfig(env);

  if (url.pathname === "/api/status") {
    if (request.method !== "GET") return methodNotAllowed("GET");
    const provider = resolveProvider(env);
    return json({
      provider: provider.provider,
      model: provider.model,
      ready: provider.provider !== "offline",
      ...publicAccountConfig(config),
    });
  }

  if (url.pathname === "/api/me") return handleMe(request, config, db);

  if (url.pathname === "/api/auth/google/start") {
    if (request.method !== "GET") return methodNotAllowed("GET");
    return startGoogleAuth(request, config);
  }

  if (url.pathname === "/api/auth/google/callback") {
    if (request.method !== "GET") return methodNotAllowed("GET");
    return finishGoogleAuth(request, config, db);
  }

  if (url.pathname === "/api/auth/logout") return handleLogout(request, db);

  if (url.pathname === "/api/billing/checkout") {
    return handleCheckout(request, config, db);
  }

  if (url.pathname === "/api/billing/portal") return handlePortal(request, config, db);

  if (url.pathname === "/api/billing/webhook") {
    return handleStripeWebhook(request, config, db);
  }

  if (url.pathname === "/api/chat") return null;
  if (url.pathname.startsWith("/api/")) return json({ error: "Not found." }, 404);
  return null;
}

/**
 * Only model-backed chat is paid. The local draft engine stays open so the
 * public demo and self-hosted clones keep working without accounts.
 */
export async function denyChatIfRequired(
  request: Request,
  env: ApiEnv,
  db: Database | null,
): Promise<Response | null> {
  const config = readConfig(env);
  if (!config.billingEnabled) return null;
  const provider = resolveProvider(env);
  if (provider.provider === "offline") return null;
  if (!isSameOrigin(request)) return json({ error: "Cross-origin request blocked." }, 403);
  if (!db) return json({ error: "Accounts are temporarily unavailable." }, 503);

  const user = await getSessionUser(request, db);
  if (!user) {
    return json(
      {
        error: "Sign in with Google to start your free trial.",
        code: "auth_required",
      },
      401,
    );
  }
  const access = accessFor(user, config);
  if (!access.canGenerate) {
    return json(
      {
        error: "Your trial has ended. Upgrade to keep writing with Claude.",
        code: "trial_expired",
        priceLabel: config.priceLabel,
      },
      402,
    );
  }
  return null;
}

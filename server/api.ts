import type { AccountEnv, StudioConfig } from "./config";
import { publicAccountConfig, readConfig } from "./config";
import type { Database, UserRecord } from "./db/types";
import type { Portfolio } from "../src/portfolio/types";
import { deletePortfolio, listPortfolios, savePortfolio } from "./portfolios";
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
const MAX_PORTFOLIO_BODY = 300_000;

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

function portfolioId(pathname: string): string | null {
  const raw = pathname.slice("/api/portfolios/".length);
  if (!raw || raw.includes("/")) return null;
  let id: string;
  try {
    id = decodeURIComponent(raw);
  } catch {
    return null;
  }
  return /^[A-Za-z0-9_-]{1,100}$/.test(id) ? id : null;
}

async function handlePortfolios(
  request: Request,
  config: StudioConfig,
  db: Database | null,
): Promise<Response> {
  if (!config.authEnabled) {
    return json({ error: "Accounts are not configured on this deployment." }, 503);
  }
  if (!db) return requireDatabase(db) as Response;

  const user = await getSessionUser(request, db);
  if (!user) {
    return json({ error: "Sign in with Google to use the studio.", code: "auth_required" }, 401);
  }

  const access = accessFor(user, config);
  // Portfolios are permanent for subscribers and for self-hosted installs.
  const keepForever = !config.billingEnabled || access.plan === "pro";
  const url = new URL(request.url);
  const now = Date.now();

  if (url.pathname === "/api/portfolios") {
    if (request.method !== "GET") return methodNotAllowed("GET");
    return json(await listPortfolios(db, user.id, { keepForever, now }));
  }

  const id = portfolioId(url.pathname);
  if (!id) return json({ error: "Not found." }, 404);

  if (request.method === "PUT") {
    if (!isSameOrigin(request)) return json({ error: "Cross-origin request blocked." }, 403);

    let text: string;
    try {
      text = await request.text();
    } catch {
      return json({ error: "Could not read the portfolio." }, 400);
    }
    if (text.length > MAX_PORTFOLIO_BODY) {
      return json({ error: "That portfolio is too large to save." }, 413);
    }

    let body: { title?: unknown; portfolio?: unknown };
    try {
      body = JSON.parse(text) as typeof body;
    } catch {
      return json({ error: "Send a valid portfolio." }, 400);
    }
    if (!body.portfolio || typeof body.portfolio !== "object" || Array.isArray(body.portfolio)) {
      return json({ error: "Send a valid portfolio." }, 400);
    }

    const result = await savePortfolio(db, user.id, {
      id,
      title: typeof body.title === "string" ? body.title : "",
      portfolio: body.portfolio as Portfolio,
      keepForever,
      now,
    });
    if (!result.ok) {
      if (result.reason === "expired") {
        return json(
          {
            error: "This trial portfolio was deleted after 14 days and cannot be restored.",
            code: "portfolio_expired",
          },
          410,
        );
      }
      return json({ error: "That portfolio id is already in use." }, 409);
    }
    return json({ project: result.project });
  }

  if (request.method === "DELETE") {
    if (!isSameOrigin(request)) return json({ error: "Cross-origin request blocked." }, 403);
    await deletePortfolio(db, user.id, id);
    return json({ ok: true });
  }

  return methodNotAllowed("GET, PUT, DELETE");
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

  if (url.pathname === "/api/portfolios" || url.pathname.startsWith("/api/portfolios/")) {
    return handlePortfolios(request, config, db);
  }

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
 * A deployment with Google configured is a private studio: every chat request
 * needs a session, even when the local draft engine is the one answering.
 * Subscriptions only add the second gate on model-backed generation.
 */
export async function denyChatIfRequired(
  request: Request,
  env: ApiEnv,
  db: Database | null,
): Promise<Response | null> {
  const config = readConfig(env);
  if (!config.authEnabled) return null;
  if (!isSameOrigin(request)) return json({ error: "Cross-origin request blocked." }, 403);
  if (!db) return json({ error: "Accounts are temporarily unavailable." }, 503);

  const user = await getSessionUser(request, db);
  if (!user) {
    return json(
      {
        error: "Sign in with Google to use the studio.",
        code: "auth_required",
      },
      401,
    );
  }

  const provider = resolveProvider(env);
  if (config.billingEnabled && provider.provider !== "offline") {
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
  }
  return null;
}

import assert from "node:assert/strict";
import test from "node:test";
import type { AccountEnv } from "../server/config";
import { readConfig } from "../server/config";
import type { UserRecord } from "../server/db/types";
import { openLocalDatabase } from "../server/db/node";
import {
  accessFor,
  createSession,
  ensureUser,
  getSessionUser,
} from "../server/account";
import { denyChatIfRequired, handleApi } from "../server/api";
import { verifyStripeSignature } from "../server/billing/stripe";

const DAY = 24 * 60 * 60 * 1000;

const ENV: AccountEnv & { ANTHROPIC_API_KEY: string } = {
  GOOGLE_CLIENT_ID: "google-client.example",
  GOOGLE_CLIENT_SECRET: "google-secret",
  STRIPE_SECRET_KEY: "sk_test_example",
  STRIPE_PRICE_ID: "price_example",
  STRIPE_WEBHOOK_SECRET: "whsec_example",
  TRIAL_DAYS: "7",
  PRICE_LABEL: "$9 / month",
  ANTHROPIC_API_KEY: "anthropic-test-key",
};

const PROFILE = {
  sub: "google-sub-1",
  email: "ada@example.com",
  name: "Ada Lovelace",
  avatarUrl: "https://example.com/ada.jpg",
};

async function hmac(secret: string, payload: string): Promise<string> {
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

function meRequest(token?: string): Request {
  return new Request("https://studio.example/api/me", {
    headers: token ? { cookie: `ps_session=${token}` } : {},
  });
}

test("trial, active, canceled, expired, and self-hosted access", async () => {
  const config = readConfig(ENV);
  const db = await openLocalDatabase(":memory:");
  try {
    const user = await ensureUser(db, PROFILE, 7);
    const trial = accessFor(user, config);
    assert.equal(trial.plan, "trial");
    assert.equal(trial.canGenerate, true);
    assert.equal(trial.trialDaysLeft, 7);

    const expired = accessFor({ ...user, trial_ends_at: Date.now() - DAY }, config);
    assert.equal(expired.plan, "expired");
    assert.equal(expired.canGenerate, false);

    const active = accessFor(
      { ...user, subscription_status: "active", stripe_customer_id: "cus_1" },
      config,
    );
    assert.equal(active.plan, "pro");
    assert.equal(active.canGenerate, true);
    assert.equal(active.manageBilling, true);

    const canceled = accessFor(
      {
        ...user,
        subscription_status: "canceled",
        current_period_end: Date.now() + 10 * DAY,
      },
      config,
    );
    assert.equal(canceled.plan, "pro");
    assert.equal(canceled.canGenerate, true);

    const selfHosted = accessFor(
      { ...user, trial_ends_at: Date.now() - DAY },
      readConfig({ ...ENV, STRIPE_SECRET_KEY: "", STRIPE_PRICE_ID: "", STRIPE_WEBHOOK_SECRET: "" }),
    );
    assert.equal(selfHosted.plan, "free");
    assert.equal(selfHosted.canGenerate, true);
  } finally {
    db.close();
  }
});

test("API reports signed-out state and a signed-in trial", async () => {
  const db = await openLocalDatabase(":memory:");
  try {
    const config = readConfig(ENV);
    assert.equal(config.billingEnabled, true);

    const signedOut = await handleApi(meRequest(), ENV, db);
    assert.equal(signedOut?.status, 200);
    const signedOutBody = (await signedOut?.json()) as Record<string, unknown>;
    assert.equal(signedOutBody.authEnabled, true);
    assert.equal(signedOutBody.billingEnabled, true);
    assert.equal(signedOutBody.user, null);

    const user = await ensureUser(db, PROFILE, 7);
    const token = await createSession(db, user.id);
    const me = await handleApi(meRequest(token), ENV, db);
    assert.equal(me?.status, 200);
    const body = (await me?.json()) as {
      user: { email: string };
      access: { plan: string };
    };
    assert.equal(body.user.email, "ada@example.com");
    assert.equal(body.access.plan, "trial");

    const sessionUser = await getSessionUser(meRequest(token), db);
    assert.equal(sessionUser?.id, user.id);

    const status = await handleApi(new Request("https://studio.example/api/status"), ENV, db);
    const statusBody = (await status?.json()) as Record<string, unknown>;
    assert.equal(statusBody.ready, true);
    assert.equal(statusBody.authEnabled, true);
    assert.equal(statusBody.billingEnabled, true);
  } finally {
    db.close();
  }
});

test("chat is gated only for a configured paid, model-backed studio", async () => {
  const db = await openLocalDatabase(":memory:");
  try {
    const user = await ensureUser(db, PROFILE, 7);
    const token = await createSession(db, user.id);

    const anonymous = await denyChatIfRequired(
      new Request("https://studio.example/api/chat", { method: "POST" }),
      ENV,
      db,
    );
    assert.equal(anonymous?.status, 401);
    assert.equal(((await anonymous?.json()) as { code: string }).code, "auth_required");

    const allowed = await denyChatIfRequired(
      new Request("https://studio.example/api/chat", {
        method: "POST",
        headers: { cookie: `ps_session=${token}` },
      }),
      ENV,
      db,
    );
    assert.equal(allowed, null);

    await db.run("UPDATE users SET trial_ends_at = ? WHERE id = ?", Date.now() - DAY, user.id);
    const expired = await denyChatIfRequired(
      new Request("https://studio.example/api/chat", {
        method: "POST",
        headers: { cookie: `ps_session=${token}` },
      }),
      ENV,
      db,
    );
    assert.equal(expired?.status, 402);
    assert.equal(((await expired?.json()) as { code: string }).code, "trial_expired");

    const offline = await denyChatIfRequired(
      new Request("https://studio.example/api/chat", { method: "POST" }),
      { ...ENV, ANTHROPIC_API_KEY: "" },
      db,
    );
    assert.equal(offline, null);
  } finally {
    db.close();
  }
});

test("Google login starts with state and rejects a mismatched callback", async () => {
  const db = await openLocalDatabase(":memory:");
  try {
    const start = await handleApi(
      new Request("https://studio.example/api/auth/google/start"),
      ENV,
      db,
    );
    assert.equal(start?.status, 302);
    assert.match(start?.headers.get("location") ?? "", /accounts\.google\.com/);
    assert.match(start?.headers.get("location") ?? "", /redirect_uri=/);
    const cookies = start?.headers.getSetCookie() ?? [];
    assert.ok(cookies.some((cookie) => cookie.startsWith("ps_oauth_state=")));

    const callback = await handleApi(
      new Request("https://studio.example/api/auth/google/callback?code=x&state=wrong", {
        headers: { cookie: cookies[0] },
      }),
      ENV,
      db,
    );
    assert.equal(callback?.status, 302);
    assert.equal(callback?.headers.get("location"), "/?auth=error");
  } finally {
    db.close();
  }
});

test("Stripe signatures accept the exact payload and reject tampering", async () => {
  const payload = JSON.stringify({ id: "evt_sig", type: "customer.subscription.updated" });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await hmac(ENV.STRIPE_WEBHOOK_SECRET ?? "", `${timestamp}.${payload}`);
  const header = `t=${timestamp},v1=${signature}`;

  assert.equal(await verifyStripeSignature(payload, header, ENV.STRIPE_WEBHOOK_SECRET ?? ""), true);
  assert.equal(
    await verifyStripeSignature(`${payload} `, header, ENV.STRIPE_WEBHOOK_SECRET ?? ""),
    false,
  );
  assert.equal(
    await verifyStripeSignature(
      payload,
      header,
      ENV.STRIPE_WEBHOOK_SECRET ?? "",
      Date.now() + 10 * 60 * 1000,
    ),
    false,
  );
});

test("a signed subscription webhook upgrades access and is idempotent", async () => {
  const db = await openLocalDatabase(":memory:");
  try {
    const user = await ensureUser(db, PROFILE, 7);
    const event = {
      id: "evt_subscription_1",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          customer: "cus_123",
          status: "active",
          current_period_end: Math.floor((Date.now() + 30 * DAY) / 1000),
          metadata: { user_id: user.id },
        },
      },
    };
    const payload = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await hmac(
      ENV.STRIPE_WEBHOOK_SECRET ?? "",
      `${timestamp}.${payload}`,
    );

    const response = await handleApi(
      new Request("https://studio.example/api/billing/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": `t=${timestamp},v1=${signature}`,
        },
        body: payload,
      }),
      ENV,
      db,
    );
    assert.equal(response?.status, 200);

    const updated = await db.first<UserRecord>("SELECT * FROM users WHERE id = ?", user.id);
    assert.equal(updated?.subscription_status, "active");
    assert.equal(updated?.stripe_customer_id, "cus_123");
    const access = accessFor(updated as UserRecord, readConfig(ENV));
    assert.equal(access.plan, "pro");

    const duplicate = await handleApi(
      new Request("https://studio.example/api/billing/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": `t=${timestamp},v1=${signature}`,
        },
        body: payload,
      }),
      ENV,
      db,
    );
    assert.equal(duplicate?.status, 200);

    const failedPayload = JSON.stringify({
      id: "evt_invoice_failed_1",
      type: "invoice.payment_failed",
      data: { object: { customer: "cus_123", subscription: "sub_123" } },
    });
    const failedSignature = await hmac(
      ENV.STRIPE_WEBHOOK_SECRET ?? "",
      `${timestamp}.${failedPayload}`,
    );
    const failed = await handleApi(
      new Request("https://studio.example/api/billing/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": `t=${timestamp},v1=${failedSignature}`,
        },
        body: failedPayload,
      }),
      ENV,
      db,
    );
    assert.equal(failed?.status, 200);
    const pastDue = await db.first<UserRecord>("SELECT * FROM users WHERE id = ?", user.id);
    assert.equal(pastDue?.subscription_status, "past_due");
    assert.equal(accessFor(pastDue as UserRecord, readConfig(ENV)).canGenerate, true);
  } finally {
    db.close();
  }
});

test("logout revokes the session cookie", async () => {
  const db = await openLocalDatabase(":memory:");
  try {
    const user = await ensureUser(db, PROFILE, 7);
    const token = await createSession(db, user.id);
    const before = await handleApi(meRequest(token), ENV, db);
    assert.equal(((await before?.json()) as { user: unknown }).user !== null, true);

    const logout = await handleApi(
      new Request("https://studio.example/api/auth/logout", {
        method: "POST",
        headers: { cookie: `ps_session=${token}` },
      }),
      ENV,
      db,
    );
    assert.equal(logout?.status, 200);
    const after = await handleApi(meRequest(token), ENV, db);
    assert.equal(((await after?.json()) as { user: unknown }).user, null);
  } finally {
    db.close();
  }
});

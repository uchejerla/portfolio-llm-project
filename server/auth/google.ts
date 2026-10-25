import { createRemoteJWKSet, jwtVerify } from "jose";
import type { StudioConfig } from "../config";
import type { Database } from "../db/types";
import { createSession, ensureUser, type GoogleProfile } from "../account";
import {
  OAUTH_STATE_COOKIE,
  clearOauthStateCookie,
  constantTimeEqual,
  json,
  oauthStateCookie,
  randomToken,
  readCookie,
  redirect,
  sessionCookie,
} from "../http";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function callbackUrl(request: Request): string {
  return new URL("/api/auth/google/callback", request.url).toString();
}

function authError(request: Request): Response {
  return redirect("/?auth=error", [clearOauthStateCookie(request)]);
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeAvatar(value: unknown): string {
  const url = clean(value, 500);
  return /^https:\/\//i.test(url) ? url : "";
}

export function startGoogleAuth(request: Request, config: StudioConfig): Response {
  if (!config.google) {
    return json({ error: "Google sign-in is not configured on this deployment." }, 503);
  }
  const state = randomToken(24);
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", config.google.clientId);
  url.searchParams.set("redirect_uri", callbackUrl(request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("access_type", "online");
  return redirect(url.toString(), [oauthStateCookie(request, state)]);
}

export async function finishGoogleAuth(
  request: Request,
  config: StudioConfig,
  db: Database | null,
): Promise<Response> {
  if (!config.google) {
    return json({ error: "Google sign-in is not configured on this deployment." }, 503);
  }
  if (!db) {
    return json({ error: "Accounts are temporarily unavailable." }, 503);
  }

  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "";
  const expectedState = readCookie(request.headers.get("cookie"), OAUTH_STATE_COOKIE);
  if (!state || !expectedState || !constantTimeEqual(state, expectedState)) {
    return authError(request);
  }
  if (url.searchParams.get("error") || !url.searchParams.get("code")) {
    return authError(request);
  }

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        code: url.searchParams.get("code") ?? "",
        grant_type: "authorization_code",
        redirect_uri: callbackUrl(request),
      }),
    });
  } catch {
    console.error("Google token exchange could not be reached.");
    return authError(request);
  }

  if (!tokenResponse.ok) {
    console.error("Google token exchange failed", tokenResponse.status);
    return authError(request);
  }

  let idToken = "";
  try {
    const payload = (await tokenResponse.json()) as { id_token?: unknown };
    idToken = typeof payload.id_token === "string" ? payload.id_token : "";
  } catch {
    return authError(request);
  }
  if (!idToken) return authError(request);

  let profile: GoogleProfile;
  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: config.google.clientId,
      clockTolerance: 60,
    });
    const email = clean(payload.email, 200);
    const verified = payload.email_verified === true || payload.email_verified === "true";
    if (!payload.sub || !email || !verified) return authError(request);
    profile = {
      sub: payload.sub,
      email,
      name: clean(payload.name, 120) || email.split("@")[0],
      avatarUrl: safeAvatar(payload.picture),
    };
  } catch (error) {
    console.error("Google ID token was rejected", (error as Error).message);
    return authError(request);
  }

  try {
    const user = await ensureUser(db, profile, config.trialDays);
    const token = await createSession(db, user.id);
    return redirect("/?auth=success", [
      clearOauthStateCookie(request),
      sessionCookie(request, token),
    ]);
  } catch (error) {
    console.error("Google sign-in could not finish", error);
    return authError(request);
  }
}

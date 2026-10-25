export const SESSION_COOKIE = "ps_session";
export const OAUTH_STATE_COOKIE = "ps_oauth_state";
export const SESSION_DAYS = 30;

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export function methodNotAllowed(allow: string): Response {
  const response = json({ error: "Method not allowed." }, 405);
  response.headers.set("allow", allow);
  return response;
}

export function redirect(location: string, cookies: string[] = []): Response {
  const headers = new Headers({
    location,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function secure(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}

function serializeCookie(
  name: string,
  value: string,
  options: { maxAge?: number; path?: string; secure: boolean },
): string {
  const parts = [`${name}=${value}`, `Path=${options.path ?? "/"}`, "HttpOnly", "SameSite=Lax"];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

export function sessionCookie(request: Request, token: string): string {
  return serializeCookie(SESSION_COOKIE, token, {
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
    secure: secure(request),
  });
}

export function clearSessionCookie(request: Request): string {
  return serializeCookie(SESSION_COOKIE, "", { maxAge: 0, path: "/", secure: secure(request) });
}

export function oauthStateCookie(request: Request, state: string): string {
  return serializeCookie(OAUTH_STATE_COOKIE, state, {
    maxAge: 10 * 60,
    path: "/api/auth/google",
    secure: secure(request),
  });
}

export function clearOauthStateCookie(request: Request): string {
  return serializeCookie(OAUTH_STATE_COOKIE, "", {
    maxAge: 0,
    path: "/api/auth/google",
    secure: secure(request),
  });
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return part.slice(separator + 1).trim() || null;
  }
  return null;
}

export function randomToken(bytes = 24): string {
  const buffer = crypto.getRandomValues(new Uint8Array(bytes));
  let binary = "";
  for (const byte of buffer) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

/**
 * Cookie-based APIs are same-site only. Requests without browser origin
 * headers (curl, tests, server-to-server) are allowed.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin === new URL(request.url).origin;
    } catch {
      return false;
    }
  }
  const site = request.headers.get("sec-fetch-site");
  return !site || site === "same-origin" || site === "none";
}

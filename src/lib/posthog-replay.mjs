/**
 * Consent-controlled PostHog session replay for Portfolio Studio.
 *
 * Browser-only. Without a project token and host nothing is initialized, and
 * even with them the SDK boots opted out with replay disabled: a recording only
 * starts after the visitor turns replay on in Studio settings. Every capture
 * channel other than replay stays off, DOM text and inputs are masked, request
 * bodies and headers are dropped, and page/request URLs lose their query,
 * fragment and sensitive path segments before they reach PostHog.
 */
import { readAnalyticsConsent, subscribeAnalyticsConsent } from "./analytics-consent.mjs";

export const POSTHOG_TOKEN_ENV = "VITE_POSTHOG_PROJECT_TOKEN";
export const POSTHOG_HOST_ENV = "VITE_POSTHOG_HOST";

const URL_PARSE_BASE = "https://replay.invalid";
const MASKED_TEXT_SELECTOR = "*";
const BLOCKED_DOM_SELECTOR = ".ph-no-capture, [data-ph-sensitive]";

/** Auth, payment and account surfaces never enter a recording. */
const SENSITIVE_PATH_SEGMENTS = new Set([
  "account",
  "accounts",
  "admin",
  "auth",
  "billing",
  "callback",
  "checkout",
  "invoice",
  "invoices",
  "log-in",
  "log-out",
  "login",
  "logout",
  "oauth",
  "password",
  "passwords",
  "payment",
  "payments",
  "recover",
  "reset",
  "session",
  "sessions",
  "settings",
  "sign-in",
  "sign-up",
  "signin",
  "signup",
  "sso",
  "subscription",
  "subscriptions",
  "token",
  "tokens",
  "verify",
]);

/** Opaque path identifiers (record ids, invite codes, emails) are not recorded. */
const OPAQUE_PATH_SEGMENT = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|(?=.*\d)[A-Za-z0-9_-]{16,})$/i;

/**
 * True when a route (pathname, or hash route) must not be recorded.
 * Unreadable or URL-encoded segments fail closed.
 *
 * @param {string} route
 * @returns {boolean}
 */
export function isSensitiveReplayPath(route) {
  if (typeof route !== "string" || !route) return false;
  for (const part of route.split(/[?#]/)) {
    for (const raw of part.split("/")) {
      if (!raw) continue;
      let segment = raw.toLowerCase();
      try {
        segment = decodeURIComponent(segment);
      } catch {
        return true;
      }
      if (SENSITIVE_PATH_SEGMENTS.has(segment)) return true;
      if (segment.includes("@")) return true;
      if (OPAQUE_PATH_SEGMENT.test(segment)) return true;
    }
  }
  return false;
}

/**
 * Redact a URL for replay: query and fragment are always removed, unparseable or
 * non-HTTP(S) URLs are rejected, and sensitive routes/identifiers are dropped.
 *
 * @param {unknown} raw
 * @param {{ base?: string, isSensitivePath?: (pathname: string) => boolean }} [options]
 * @returns {string | null}
 */
export function sanitizeReplayUrl(raw, options = {}) {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;

  const isRelative = !/^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith("//");
  let url;
  try {
    url = new URL(value, options.base ?? URL_PARSE_BASE);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;

  const pathname = url.pathname || "/";
  const sensitive = options.isSensitivePath
    ? options.isSensitivePath(pathname)
    : isSensitiveReplayPath(pathname);
  if (sensitive) return null;

  return isRelative ? pathname : `${url.origin}${pathname}`;
}

/**
 * The network hook PostHog also calls with replay page URLs, so it is the single
 * place where every recorded URL is redacted.
 *
 * @param {{ name?: unknown } | null | undefined} request
 * @param {{ base?: string, isSensitivePath?: (pathname: string) => boolean }} [options]
 * @returns {Record<string, unknown> | null}
 */
export function maskReplayNetworkEntry(request, options = {}) {
  if (!request || typeof request !== "object") return null;
  const name = sanitizeReplayUrl(request.name, options);
  if (!name) return null;
  return { ...request, name };
}

/**
 * Project settings: nothing is captured implicitly, replay is the only channel
 * and it is off until the visitor opts in.
 *
 * @param {{ host?: string, isSensitivePath?: (pathname: string) => boolean }} [options]
 */
export function createReplayPrivacyConfig(options = {}) {
  const isSensitivePath = options.isSensitivePath ?? isSensitiveReplayPath;
  return {
    api_host: options.host,
    opt_out_capturing_by_default: true,
    disable_session_recording: true,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    rageclick: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    enable_recording_console_log: false,
    capture_performance: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: MASKED_TEXT_SELECTOR,
      recordBody: false,
      recordHeaders: false,
      captureCanvas: { recordCanvas: false },
      captureJsonLd: false,
      blockSelector: BLOCKED_DOM_SELECTOR,
      maskCapturedNetworkRequestFn: (request) => maskReplayNetworkEntry(request, { isSensitivePath }),
    },
  };
}

/** @returns {{ token: string, host: string }} */
function readReplayEnv() {
  let env = {};
  try {
    env = import.meta.env ?? {};
  } catch {
    env = {};
  }
  const token = typeof env.VITE_POSTHOG_PROJECT_TOKEN === "string" ? env.VITE_POSTHOG_PROJECT_TOKEN : "";
  const host = typeof env.VITE_POSTHOG_HOST === "string" ? env.VITE_POSTHOG_HOST : "";
  return { token: token.trim(), host: host.trim() };
}

/** @param {() => void} onChange */
function subscribeBrowserLocation(onChange) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", onChange);
  window.addEventListener("hashchange", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("hashchange", onChange);
  };
}

/** @returns {string} */
function readBrowserRoute() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.hash}`;
}

/**
 * Build a replay controller around an injected PostHog client, consent source and
 * router, so its behaviour can be exercised without a browser or a network.
 *
 * @param {{
 *   sdk?: any,
 *   env?: { token?: string, host?: string },
 *   consent?: { get: () => string, subscribe: (listener: (value: string) => void) => () => void },
 *   getPathname?: () => string,
 *   subscribeLocation?: (listener: () => void) => () => void,
 *   isSensitivePath?: (route: string) => boolean,
 *   onError?: (error: unknown) => void,
 * }} [deps]
 */
export function createReplayController(deps = {}) {
  const {
    env = {},
    consent = { get: () => "unknown", subscribe: () => () => {} },
    getPathname = () => "/",
    subscribeLocation = () => () => {},
    isSensitivePath = isSensitiveReplayPath,
    onError,
  } = deps;

  let sdk = deps.sdk ?? null;
  let initialized = false;
  let optedIn = false;
  let recording = false;
  let mounted = false;
  let unsubscribeConsent = null;
  let unsubscribeLocation = null;

  const token = typeof env.token === "string" ? env.token.trim() : "";
  const host = typeof env.host === "string" ? env.host.trim() : "";
  const configured = Boolean(token && host);

  /** @param {string} name @param {unknown[]} args */
  function call(name, ...args) {
    const target = sdk && typeof sdk[name] === "function" ? sdk[name] : null;
    if (!target) return false;
    try {
      target.apply(sdk, args);
      return true;
    } catch (error) {
      try {
        onError?.(error);
      } catch {
        // A failing error reporter must not break the studio either.
      }
      return false;
    }
  }

  /** Initialize at most once, and never over an already initialized client. */
  function ensureInitialized() {
    if (!configured || initialized || !sdk) return false;
    if (sdk.__loaded === true) {
      initialized = true;
      return false;
    }
    const ok = call("init", token, createReplayPrivacyConfig({ host, isSensitivePath }));
    if (ok) initialized = true;
    return ok;
  }

  /** Apply the current consent and route to the SDK. */
  function applyState() {
    if (!mounted || !initialized) return;

    let granted = false;
    let sensitive = true;
    try {
      granted = consent.get() === "granted";
      sensitive = isSensitivePath(getPathname()) === true;
    } catch {
      // Unknown consent or an unreadable route: keep capture off.
      granted = false;
      sensitive = true;
    }

    if (granted && !sensitive) {
      if (!optedIn) {
        call("opt_in_capturing");
        optedIn = true;
      }
      if (!recording) {
        // Plain start: project enablement, sampling, triggers, minimum duration
        // and authorized domains still decide whether anything is recorded.
        call("startSessionRecording");
        recording = true;
      }
      return;
    }

    if (recording) {
      call("stopSessionRecording");
      recording = false;
    }
    if (!granted && optedIn) {
      call("opt_out_capturing");
      optedIn = false;
    }
  }

  const controller = {
    /** @param {any} candidate */
    attachSdk(candidate) {
      if (!candidate) return controller;
      sdk = sdk ?? candidate;
      ensureInitialized();
      applyState();
      return controller;
    },

    mount() {
      if (mounted) return controller;
      mounted = true;
      ensureInitialized();
      if (!configured) return controller;
      if (typeof consent.subscribe === "function") {
        unsubscribeConsent = consent.subscribe(() => applyState()) ?? null;
      }
      if (typeof subscribeLocation === "function") {
        unsubscribeLocation = subscribeLocation(() => applyState()) ?? null;
      }
      applyState();
      return controller;
    },

    unmount() {
      if (!mounted) return controller;
      mounted = false;
      if (recording) {
        call("stopSessionRecording");
        recording = false;
      }
      const offConsent = unsubscribeConsent;
      const offLocation = unsubscribeLocation;
      unsubscribeConsent = null;
      unsubscribeLocation = null;
      try {
        offConsent?.();
      } catch {
        // Listener cleanup is best effort.
      }
      try {
        offLocation?.();
      } catch {
        // Listener cleanup is best effort.
      }
      return controller;
    },

    status() {
      return { configured, initialized, mounted, optedIn, recording };
    },
  };

  return controller;
}

/** @type {{ controller: ReturnType<typeof createReplayController>, unmount: () => void } | null} */
let activeMount = null;

/**
 * Mount replay for this page: one controller, one SDK initialization, one set of
 * listeners. Returns the same handle on repeated calls.
 */
export function mountPostHogReplay() {
  if (activeMount) return activeMount;

  const controller = createReplayController({
    env: readReplayEnv(),
    getPathname: readBrowserRoute,
    subscribeLocation: subscribeBrowserLocation,
    consent: { get: readAnalyticsConsent, subscribe: subscribeAnalyticsConsent },
  });

  const handle = {
    controller,
    unmount() {
      controller.unmount();
      if (activeMount === handle) activeMount = null;
    },
  };
  activeMount = handle;

  controller.mount();
  if (!controller.status().configured) return handle;

  // Loaded on demand so a build without project settings ships no replay code path.
  import("posthog-js")
    .then((module) => controller.attachSdk(module.default ?? module))
    .catch(() => {
      // A blocked or failed SDK download leaves the studio fully usable.
    });

  return handle;
}

/**
 * Analytics and session-replay consent, stored per browser.
 *
 * "unknown" is the default and never records. Only an explicit toggle in Studio
 * settings grants consent; storage that cannot be read is treated as no consent.
 */

const CONSENT_KEY = "portfolio-studio:analytics-consent:v1";
const CONSENT_EVENT = "portfolio-studio:analytics-consent";

/** @typedef {"granted" | "denied" | "unknown"} AnalyticsConsent */

/** @returns {AnalyticsConsent} */
export function readAnalyticsConsent() {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    if (value === "granted") return "granted";
    if (value === "denied" || value === "withdrawn") return "denied";
  } catch {
    // Storage can be blocked (private mode, browser policy): that is not consent.
  }
  return "unknown";
}

/** @param {"granted" | "denied" | "withdrawn"} value */
function writeAnalyticsConsent(value) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Without storage the choice lasts for this page view only.
  }
  try {
    window.dispatchEvent(new Event(CONSENT_EVENT));
  } catch {
    // No window (tests, SSR): listeners simply do not fire.
  }
}

export function grantAnalyticsConsent() {
  writeAnalyticsConsent("granted");
}

export function denyAnalyticsConsent() {
  writeAnalyticsConsent("denied");
}

export function withdrawAnalyticsConsent() {
  writeAnalyticsConsent("withdrawn");
}

/**
 * @param {(consent: AnalyticsConsent) => void} listener
 * @returns {() => void}
 */
export function subscribeAnalyticsConsent(listener) {
  const onLocalChange = () => listener(readAnalyticsConsent());
  const onStorage = (event) => {
    if (!event || event.key === null || event.key === CONSENT_KEY) onLocalChange();
  };
  window.addEventListener(CONSENT_EVENT, onLocalChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onLocalChange);
    window.removeEventListener("storage", onStorage);
  };
}

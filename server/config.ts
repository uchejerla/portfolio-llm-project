export interface AccountEnv {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  TRIAL_DAYS?: string;
  PRICE_LABEL?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_ID?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
}

export interface StripeConfig {
  secretKey: string;
  priceId: string;
  webhookSecret: string;
}

export interface StudioConfig {
  authEnabled: boolean;
  billingEnabled: boolean;
  trialDays: number;
  priceLabel: string;
  google: GoogleConfig | null;
  stripe: StripeConfig | null;
}

export interface PublicAccountConfig {
  authEnabled: boolean;
  billingEnabled: boolean;
  trialDays: number;
  portfolioTrialDays: number;
  priceLabel: string;
}

const DEFAULT_TRIAL_DAYS = 7;
const DEFAULT_PRICE_LABEL = "$9 / month";

/** Trial portfolios are hard-deleted this many days after they're created. */
export const PORTFOLIO_TRIAL_DAYS = 14;

function clean(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function trialDays(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return DEFAULT_TRIAL_DAYS;
  return Math.min(60, Math.max(0, parsed));
}

/**
 * Accounts are optional. Without Google credentials the studio stays
 * self-hosted and open, which keeps local development and clones useful.
 * Billing only switches on when Google sign-in and all Stripe values exist.
 */
export function readConfig(env: AccountEnv): StudioConfig {
  const googleId = clean(env.GOOGLE_CLIENT_ID);
  const googleSecret = clean(env.GOOGLE_CLIENT_SECRET);
  const google =
    googleId && googleSecret ? { clientId: googleId, clientSecret: googleSecret } : null;

  const stripeKey = clean(env.STRIPE_SECRET_KEY);
  const stripePrice = clean(env.STRIPE_PRICE_ID);
  const stripeSecret = clean(env.STRIPE_WEBHOOK_SECRET);
  const stripe =
    stripeKey && stripePrice && stripeSecret
      ? { secretKey: stripeKey, priceId: stripePrice, webhookSecret: stripeSecret }
      : null;

  const authEnabled = Boolean(google);
  return {
    authEnabled,
    billingEnabled: authEnabled && Boolean(stripe),
    trialDays: trialDays(env.TRIAL_DAYS),
    priceLabel: clean(env.PRICE_LABEL).slice(0, 40) || DEFAULT_PRICE_LABEL,
    google,
    stripe,
  };
}

export function publicAccountConfig(config: StudioConfig): PublicAccountConfig {
  return {
    authEnabled: config.authEnabled,
    billingEnabled: config.billingEnabled,
    trialDays: config.trialDays,
    portfolioTrialDays: PORTFOLIO_TRIAL_DAYS,
    priceLabel: config.priceLabel,
  };
}

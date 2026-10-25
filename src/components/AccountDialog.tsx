import { useState } from "react";
import type { AccountIntent, AccountState } from "../lib/account";
import {
  openAccountPortal,
  signOutAccount,
  startAccountCheckout,
} from "../lib/account";
import { Avatar } from "./Avatar";
import { SparkIcon, XIcon } from "./Icons";

interface AccountDialogProps {
  account: AccountState | null;
  intent: AccountIntent;
  onClose: () => void;
  onRefresh: () => Promise<void> | void;
  notify: (text: string) => void;
}

function planName(account: AccountState): string {
  if (account.access?.plan === "pro") return "Studio Pro";
  if (account.access?.plan === "trial") return "Free trial";
  if (account.access?.plan === "expired") return "Trial ended";
  return "Self-hosted";
}

function planNote(account: AccountState): string {
  if (account.access?.plan === "pro") {
    if (account.access.subscriptionStatus === "past_due") return "Payment needs attention";
    return "Active subscription";
  }
  if (account.access?.plan === "trial") {
    const days = account.access.trialDaysLeft;
    return `${days} ${days === 1 ? "day" : "days"} left · no card required`;
  }
  if (account.access?.plan === "expired") return "Upgrade to keep Claude writing";
  return "Billing is off · unlimited studio";
}

export function AccountDialog({
  account,
  intent,
  onClose,
  onRefresh,
  notify,
}: AccountDialogProps) {
  const [busy, setBusy] = useState<"checkout" | "portal" | "signout" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signedIn = Boolean(account?.user);
  const plan = account?.access?.plan ?? "free";
  const authEnabled = account?.authEnabled ?? false;
  const billingEnabled = account?.billingEnabled ?? false;
  const priceLabel = account?.priceLabel ?? "$9 / month";
  const trialDays = account?.trialDays ?? 7;

  const heading = !authEnabled
    ? "Accounts are not configured."
    : !signedIn
      ? !billingEnabled
        ? "Sign in to your studio."
        : intent === "upgrade"
          ? "Sign in to keep your studio."
          : "Start your free trial."
      : plan === "pro"
        ? "Studio Pro is active."
        : plan === "expired"
          ? "Your trial has ended."
          : "Your studio pass.";

  const checkout = async () => {
    setError(null);
    setBusy("checkout");
    try {
      window.location.assign(await startAccountCheckout());
    } catch (problem) {
      setError((problem as Error).message);
      setBusy(null);
    }
  };

  const portal = async () => {
    setError(null);
    setBusy("portal");
    try {
      window.location.assign(await openAccountPortal());
    } catch (problem) {
      setError((problem as Error).message);
      setBusy(null);
    }
  };

  const signOut = async () => {
    setError(null);
    setBusy("signout");
    try {
      await signOutAccount();
      await onRefresh();
      notify("Signed out. Your portfolios are still on this device.");
      onClose();
    } catch (problem) {
      setError((problem as Error).message);
      setBusy(null);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal modal--account ph-no-capture"
        data-ph-sensitive=""
        role="dialog"
        aria-modal="true"
        aria-label="Portfolio Studio account"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__head">
          <div>
            <span className="eyebrow">Studio pass</span>
            <h2>{heading}</h2>
            <p>
              {signedIn
                ? "One account for your trial, plan, and payment history."
                : !authEnabled
                  ? "This deployment is self-hosted and open. Add Google OAuth keys to turn on sign-in and trials."
                  : !billingEnabled
                    ? "Continue with Google to create your studio pass. Billing is off on this deployment."
                    : trialDays > 0
                      ? `Continue with Google to start ${trialDays} days of Claude, no card required.`
                      : "Continue with Google to create your studio pass."}
            </p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close account">
            <XIcon width={18} height={18} />
          </button>
        </header>

        <div className="account">
          {!authEnabled ? (
            <div className="account-setup">
              <span className="account-setup__mark">
                <SparkIcon width={19} height={19} />
              </span>
              <div>
                <b>Accounts are not configured.</b>
                <p>
                  This studio is running self-hosted. Add Google OAuth keys to turn on sign-in,
                  trials, and subscriptions.
                </p>
              </div>
            </div>
          ) : !signedIn ? (
            <div className="account-signin">
              <div className="account-signin__mark">G</div>
              <div className="account-signin__copy">
                <b>Your work stays yours.</b>
                <p>
                  Your portfolios remain in this browser. The account only carries your trial and
                  plan, and Google shares your name, email, and avatar.
                </p>
              </div>
              <a className="account-google" href="/api/auth/google/start">
                <span className="account-google__g">G</span>
                Continue with Google
              </a>
              {!billingEnabled && (
                <p className="account-small">
                  Accounts are on, but Stripe billing is not configured on this deployment.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="account-user">
                <Avatar user={account?.user ?? null} className="account-user__avatar" />
                <div className="account-user__text">
                  <b>{account?.user?.name || "Your account"}</b>
                  <small>{account?.user?.email}</small>
                </div>
                <button
                  type="button"
                  className="account-signout"
                  onClick={() => void signOut()}
                  disabled={busy !== null}
                >
                  {busy === "signout" ? "Signing out…" : "Sign out"}
                </button>
              </div>

              <div className={`account-plan account-plan--${plan}`}>
                <div className="account-plan__row">
                  <span className="account-plan__mark">
                    <SparkIcon width={17} height={17} />
                  </span>
                  <div>
                    <b>{planName(account as AccountState)}</b>
                    <small>{planNote(account as AccountState)}</small>
                  </div>
                  {billingEnabled && plan !== "free" && (
                    <span className="account-plan__badge">{priceLabel}</span>
                  )}
                </div>
                {plan === "trial" && account?.access && (
                  <div className="trial-meter" aria-hidden="true">
                    <i
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            (account.access.trialDaysLeft / Math.max(1, trialDays)) * 100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {plan === "pro" && account?.access?.manageBilling ? (
                <button
                  type="button"
                  className="account-primary"
                  onClick={() => void portal()}
                  disabled={busy !== null}
                >
                  {busy === "portal" ? "Opening billing…" : "Manage billing"}
                </button>
              ) : billingEnabled && (plan === "trial" || plan === "expired") ? (
                <button
                  type="button"
                  className="account-primary"
                  onClick={() => void checkout()}
                  disabled={busy !== null}
                >
                  {busy === "checkout" ? "Opening checkout…" : `Upgrade to Pro — ${priceLabel}`}
                </button>
              ) : (
                <div className="account-note">
                  {billingEnabled
                    ? "Your plan is managed in Stripe."
                    : "Billing is off on this deployment, so the studio is unlimited."}
                </div>
              )}

              {plan === "trial" && billingEnabled && (
                <p className="account-small">
                  Your card is only charged when you upgrade. Cancel any time in Stripe.
                </p>
              )}
              {plan === "expired" && (
                <p className="account-small">
                  Portfolios and HTML exports stay available. Claude writing pauses until you
                  upgrade.
                </p>
              )}
            </>
          )}

          {error && <div className="account-error">{error}</div>}
        </div>

        <footer className="modal__foot">
          <span>Portfolios stay in this browser · payments by Stripe</span>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

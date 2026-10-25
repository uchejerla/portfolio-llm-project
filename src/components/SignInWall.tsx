import type { AccountState } from "../lib/account";
import { TEMPLATES } from "../portfolio/templates/meta";
import { SparkIcon } from "./Icons";

export function StudioBoot({
  error = false,
  onRetry,
}: {
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="boot">
      <span className="brand-mark">
        <SparkIcon width={18} height={18} />
      </span>
      <p>{error ? "The studio could not reach its server." : "Opening the studio…"}</p>
      {error && onRetry && (
        <button className="ghost-button" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function SignInWall({
  account,
  authError,
}: {
  account: AccountState;
  authError: boolean;
}) {
  const portfolioDays = account.portfolioTrialDays;
  const paid = account.billingEnabled;

  return (
    <div className="gate">
      <header className="gate__top">
        <div className="side-brand">
          <span className="brand-mark">
            <SparkIcon width={17} height={17} />
          </span>
          <div className="brand-name">
            Portfolio Studio
            <span>Your work, in widescreen</span>
          </div>
        </div>
        <span className="gate__status">Private studio</span>
      </header>

      <main className="gate__main">
        <div className="gate__copy">
          <span className="eyebrow">Sign in to begin</span>
          <h1>
            Your work deserves
            <br />a <em>stage.</em>
          </h1>
          <p className="gate__lede">
            {paid
              ? `A private studio for turning who you are into a portfolio worth sending. Sign in with Google to start ${account.trialDays} days of Claude — no card required.`
              : "A private studio for turning who you are into a portfolio worth sending. Sign in with Google to open your workspace."}
          </p>

          <a className="gate__google" href="/api/auth/google/start">
            <span className="gate__g" aria-hidden="true">
              G
            </span>
            Continue with Google
          </a>

          {authError && (
            <p className="gate__error" role="alert">
              Google sign-in didn't finish. Please try again.
            </p>
          )}

          <ul className="gate__facts">
            {paid ? (
              <>
                <li>
                  <b>{account.trialDays} days</b> of Claude, no card
                </li>
                <li>
                  <b>{portfolioDays} days</b> to keep your trial portfolio
                </li>
                <li>
                  <b>Pro</b> keeps it permanently and unlocks HTML downloads
                </li>
              </>
            ) : (
              <>
                <li>
                  <b>Signed-in work</b> stays with your account
                </li>
                <li>
                  <b>No card</b> — billing is off on this deployment
                </li>
              </>
            )}
          </ul>

          <p className="gate__fine">
            {paid
              ? `Trial portfolios are permanently deleted ${portfolioDays} days after creation unless you upgrade. HTML downloads are part of Pro.`
              : "Your portfolios save to your account. Conversations stay on this device."}
          </p>
        </div>

        <div className="gate__stage" aria-hidden="true">
          {TEMPLATES.slice(0, 3).map((template, index) => (
            <div
              className="gate__poster"
              key={template.id}
              style={{
                background: template.preview.background,
                color: template.preview.foreground,
                ["--poster-accent" as string]: template.preview.accent,
              }}
            >
              <span className="gate__poster-label">{template.name}</span>
              <b>Work worth watching.</b>
              <i />
              <small>Portfolio / 2026</small>
              <em>0{index + 1}</em>
            </div>
          ))}
        </div>
      </main>

      <footer className="gate__foot">
        <span>Portfolio Studio</span>
        <span>Google sign-in · portfolios saved to your account</span>
        <span>© 2026</span>
      </footer>
    </div>
  );
}

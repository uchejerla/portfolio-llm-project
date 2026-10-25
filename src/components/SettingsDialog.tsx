import { useState, useSyncExternalStore } from "react";
import type { ServerStatus } from "../portfolio/types";
import { formatModel } from "../lib/samples";
import {
  grantAnalyticsConsent,
  readAnalyticsConsent,
  subscribeAnalyticsConsent,
  withdrawAnalyticsConsent,
} from "../lib/analytics-consent.mjs";
import { CheckIcon, CopyIcon, SparkIcon, XIcon } from "./Icons";

interface SettingsDialogProps {
  status: ServerStatus | null;
  onClose: () => void;
}

const ENV_TEMPLATE = `# Claude (recommended)
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-5

# Or an OpenAI-compatible endpoint
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini`;

export function SettingsDialog({ status, onClose }: SettingsDialogProps) {
  const [copied, setCopied] = useState(false);
  const consent = useSyncExternalStore(
    subscribeAnalyticsConsent,
    readAnalyticsConsent,
    (): "granted" | "denied" | "unknown" => "unknown",
  );
  const connected = status?.provider === "anthropic" || status?.provider === "openai";

  const copyEnv = async () => {
    try {
      await navigator.clipboard.writeText(ENV_TEMPLATE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal modal--settings"
        role="dialog"
        aria-modal="true"
        aria-label="Studio settings"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__head">
          <div>
            <span className="eyebrow">Studio settings</span>
            <h2>Who's writing?</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close settings">
            <XIcon width={18} height={18} />
          </button>
        </header>

        <div className={`connection ${connected ? "is-connected" : ""}`}>
          <span className="connection__mark">
            <SparkIcon width={18} height={18} />
          </span>
          <div>
            <b>{status ? formatModel(status.provider, status.model) : "Studio server not reachable"}</b>
            <small>
              {connected
                ? `${status?.model} · requests proxied by your local server`
                : status?.provider === "offline"
                  ? "Local draft mode · no model key detected"
                  : "Start the dev server to connect the studio"}
            </small>
          </div>
          <span className={`connection__badge ${connected ? "is-live" : ""}`}>
            {connected ? "Connected" : status?.provider === "offline" ? "Draft mode" : "Offline"}
          </span>
        </div>

        <section className="settings-block">
          <h3>Connect Claude</h3>
          <p>
            Add a key to the server environment — <code>.env</code> locally, or Sites → Secrets on a
            hosted deployment — then restart or redeploy. The key stays on the server; it is never
            sent to the browser or saved in your chats.
          </p>
          <pre>
            <code>{ENV_TEMPLATE}</code>
          </pre>
          <div className="settings-block__actions">
            <button type="button" className="ghost-button" onClick={() => void copyEnv()}>
              {copied ? <CheckIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />}
              {copied ? "Copied" : "Copy .env template"}
            </button>
            <span>
              or set <code>OPENAI_API_KEY</code> for any OpenAI-compatible endpoint.
            </span>
          </div>
        </section>

        <section className="settings-block">
          <h3>Session replay</h3>
          <p>
            Off by default. Turning it on records a masked replay of this studio — pages, clicks and
            layout — so rough edges are easier to spot. Inputs, text, canvases, request bodies,
            headers and URL query strings are excluded before anything is sent.
          </p>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={consent === "granted"}
              onChange={(event) => {
                if (event.target.checked) grantAnalyticsConsent();
                else withdrawAnalyticsConsent();
              }}
            />
            <span>Record masked session replays of this studio</span>
          </label>
        </section>

        <section className="settings-block">
          <h3>Fine print</h3>
          <ul className="settings-list">
            <li>Conversations and blueprints are saved in this browser only.</li>
            <li>Exports are self-contained HTML — no account, framework or hosting required.</li>
            <li>
              If accounts are enabled, Google shares your name, email and avatar. Your trial and
              plan are stored on the server; cards are handled by Stripe and never touch the studio.
            </li>
            <li>
              Without a key, the local draft engine assembles a starter portfolio from your brief.
              It can change templates and colours, but it cannot rewrite copy.
            </li>
            <li>Your prompts go only to the model provider you configure.</li>
          </ul>
        </section>

        <footer className="modal__foot">
          <span>Portfolio Studio · local-first</span>
          <button type="button" className="primary-button" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

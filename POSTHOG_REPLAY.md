# PostHog session replay

One masked, consent-controlled browser journey through Portfolio Studio. Replay is off
until a visitor turns it on in Studio settings; without project settings the integration
does nothing at all.

## Baseline and wiring

| | |
| --- | --- |
| package manager | npm 10.9.9 (Node 22.23.3) |
| lock files | `package-lock.json` only — no `yarn.lock`, `pnpm-lock.yaml` or `bun.lockb` |
| SDK-importing package | this package, `portfolio-studio` (single package, root importer, Vite + React 18) |
| browser entry | `index.html` → `src/main.tsx` |
| baseline before changes | `npm run typecheck` passed; `npm test` passed (7/7). There is no lint script in this repository. |

Install (already applied, exact version):

```bash
npm install posthog-js@1.438.13
```

`package.json` declares `"posthog-js": "1.438.13"` and `package-lock.json` resolves that
version from the root importer (`node_modules/posthog-js`).

## Mount

- `src/main.tsx` calls `mountPostHogReplay()` once, before React renders.
- `src/lib/posthog-replay.mjs` holds the controller, the privacy config and the URL hook.
  It reads `import.meta.env`, so it is browser-only and no-ops without settings.
- `posthog-js` is imported with a static-friendly dynamic `import("posthog-js")` inside the
  mount, from this package's own `node_modules`.
- `src/lib/analytics-consent.mjs` is the single consent source: per-browser storage with
  `unknown`, `granted`, `denied`/`withdrawn`. Default is `unknown`, which never records.
  Unreadable storage counts as no consent.
- Repeated `mountPostHogReplay()` calls return the same handle, so StrictMode/HMR
  remounts add no second SDK init, no second recording and no duplicate listeners.
  `handle.unmount()` unsubscribes both listeners and stops recording.

## Consent rules

- The SDK is initialized with `opt_out_capturing_by_default: true` and
  `disable_session_recording: true`, so a new visitor never sends a recording.
- Consent granted: `opt_in_capturing()` then a plain `startSessionRecording()` — PostHog's
  project enablement, sampling, triggers, minimum duration and authorized domains still
  decide whether anything is stored. Nothing is forced.
- Sensitive route (auth, payment, account, opaque ids and emails in the path) or leaving
  the studio: `stopSessionRecording()`.
- Consent withdrawn: recording stops and capture is opted out. A denied visitor who
  re-enters stays stopped.
- Unmount: recording stops.
- An already initialized client (`__loaded`) keeps its own settings and is never
  re-initialized.

## Privacy boundaries

Non-replay channels are explicitly off: `autocapture`, `capture_pageview`,
`capture_pageleave`, `capture_dead_clicks`, `rageclick`, `capture_exceptions`,
`capture_heatmaps`, `enable_recording_console_log`, `capture_performance`.

Session recording: `maskAllInputs: true`, `maskTextSelector: "*"`, `recordBody: false`,
`recordHeaders: false`, `captureCanvas: { recordCanvas: false }`, `captureJsonLd: false`,
`blockSelector: ".ph-no-capture, [data-ph-sensitive]"` (keeps `ph-no-capture` working and
adds this app's own marker; the account/billing dialog carries both).

`session_recording.maskCapturedNetworkRequestFn` also receives replay page URLs, so it is
the single redaction point: query string and fragment are removed, non-HTTP(S) or
unparseable URLs and URLs with embedded credentials return `null` (dropped), and
sensitive routes or opaque path identifiers return `null` as well.

No event properties are sent: nothing in the app calls `capture()` with names, emails,
form values or free text.

## Configure privately

Set these in a git-ignored `.env.local` for local dev, or in the host's environment when
deployed. `.env.example` ships both empty on purpose — pick your region yourself:

```
VITE_POSTHOG_PROJECT_TOKEN=      # public project token from Project settings
VITE_POSTHOG_HOST=               # https://us.i.posthog.com or https://eu.i.posthog.com
```

The token is the public project token, never a personal or secret API key. With either
value missing, no SDK is loaded and no request leaves the browser.

In PostHog, check the project's session replay settings: recording enabled, sampling rate,
triggers, minimum duration and authorized domains. Nothing here changes them remotely.

## Verify

Offline, against a mocked SDK (runs in a child process with a scrubbed environment):

```bash
node --test tests/posthog-replay.check.mjs
```

Against your own project:

1. Put the token and host in `.env.local`, then restart `npm run dev`.
2. Open the studio, then Studio settings → Session replay and turn it on.
3. Run the safe journey: start a portfolio chat, switch templates, export the site. Do not
   enter real personal data.
4. Open the recording in PostHog. Confirm the journey is readable at a structural level,
   inputs and text are masked, and no URL carries a query string, auth or billing path.
5. Turn session replay off, or sign out of the tab, and confirm capture stops.

If playback is missing or shows unmasked content, do not treat it as confirmed: report
what you see (without credentials) and leave replay off until it is fixed.

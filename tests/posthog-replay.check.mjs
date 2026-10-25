/**
 * Offline checks for the consent-controlled PostHog session replay integration.
 *
 * The fixture imports the real controller that src/main.tsx mounts and injects an
 * SDK, router and consent source. No browser, no network, no project settings:
 * the environment is scrubbed before anything is read, synthetic configuration is
 * injected explicitly, and the whole suite is re-run once in a child process that
 * starts from an empty environment.
 *
 * Run: node --test tests/posthog-replay.check.mjs
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const FILE = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(FILE));
const SDK_NAME = "posthog-js";
const SDK_VERSION = "1.438.13";
const SYNTHETIC_TOKEN = "synthetic-project-token";
const SYNTHETIC_HOST = "https://posthog.invalid";

const ENTRY = join(ROOT, "src", "main.tsx");
const CONTROLLER = join(ROOT, "src", "lib", "posthog-replay.mjs");
const CONSENT_STORE = join(ROOT, "src", "lib", "analytics-consent.mjs");

const IS_CHILD = process.env.POSTHOG_REPLAY_CHECK_CHILD === "1";

// Host/platform values may stay; every project setting is dropped so the checks
// can only ever see the synthetic configuration below.
const OS_ENV = new Set(["PATH", "HOME", "TMPDIR", "POSTHOG_REPLAY_CHECK_CHILD"]);
if (!IS_CHILD) {
  for (const key of Object.keys(process.env)) {
    if (!OS_ENV.has(key)) delete process.env[key];
  }
}

const CHILD_ENV = {
  PATH: process.env.PATH ?? "/usr/bin:/bin",
  HOME: process.env.HOME ?? "/tmp",
  TMPDIR: process.env.TMPDIR ?? "/tmp",
  POSTHOG_REPLAY_CHECK_CHILD: "1",
  VITE_POSTHOG_PROJECT_TOKEN: SYNTHETIC_TOKEN,
  VITE_POSTHOG_HOST: SYNTHETIC_HOST,
};

// Network access is denied for the whole fixture.
const networkAttempts = [];
globalThis.fetch = (input) => {
  networkAttempts.push(String(input));
  return Promise.reject(new Error("network access is disabled in the replay checks"));
};

const replay = await import(pathToFileURL(CONTROLLER).href);
const {
  createReplayController,
  createReplayPrivacyConfig,
  isSensitiveReplayPath,
  mountPostHogReplay,
  sanitizeReplayUrl,
} = replay;

const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const lock = JSON.parse(readFileSync(join(ROOT, "package-lock.json"), "utf8"));
const entrySource = readFileSync(ENTRY, "utf8");
const controllerSource = readFileSync(CONTROLLER, "utf8");

/** @param {{ fail?: string[], loaded?: boolean }} [options] */
function createSdkStub(options = {}) {
  const failing = new Set(options.fail ?? []);
  const stub = {
    calls: [],
    __loaded: Boolean(options.loaded),
    count(name) {
      return stub.calls.filter((call) => call.name === name).length;
    },
    callsTo(name) {
      return stub.calls.filter((call) => call.name === name);
    },
  };
  for (const name of [
    "init",
    "opt_in_capturing",
    "opt_out_capturing",
    "startSessionRecording",
    "stopSessionRecording",
  ]) {
    stub[name] = (...args) => {
      if (failing.has(name)) throw new Error(`${name} is unavailable`);
      stub.calls.push({ name, args });
      if (name === "init") stub.__loaded = true;
    };
  }
  return stub;
}

function createConsentStub(initial = "unknown") {
  let value = initial;
  const listeners = new Set();
  const emit = () => {
    for (const listener of listeners) listener(value);
  };
  return {
    get: () => value,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    grant() {
      value = "granted";
      emit();
    },
    deny() {
      value = "denied";
      emit();
    },
    withdraw() {
      value = "denied";
      emit();
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

function createRouteStub(initial = "/") {
  let pathname = initial;
  const listeners = new Set();
  return {
    getPathname: () => pathname,
    subscribeLocation(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    go(next) {
      pathname = next;
      for (const listener of listeners) listener();
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

function setup(overrides = {}) {
  const sdk = overrides.sdk ?? createSdkStub();
  const route = overrides.route ?? createRouteStub();
  const consent = overrides.consent ?? createConsentStub(overrides.consentValue ?? "unknown");
  const controller = createReplayController({
    sdk,
    env: overrides.env ?? { token: SYNTHETIC_TOKEN, host: SYNTHETIC_HOST },
    consent,
    getPathname: route.getPathname,
    subscribeLocation: route.subscribeLocation,
  });
  return { controller, sdk, route, consent };
}

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

test("the workspace manifest, lock and resolution pin posthog-js 1.438.13", () => {
  assert.equal(manifest.dependencies?.[SDK_NAME], SDK_VERSION);
  assert.equal(lock.packages?.[""]?.dependencies?.[SDK_NAME], SDK_VERSION);

  const locked = lock.packages?.[`node_modules/${SDK_NAME}`];
  assert.equal(locked?.version, SDK_VERSION);
  assert.match(String(locked?.resolved), /posthog-js-1\.438\.13\.tgz$/);
  assert.match(String(locked?.integrity), /^sha512-/);

  // The importer's lock is the only lock, and the install matches it.
  assert.equal(existsSync(join(ROOT, "yarn.lock")), false);
  assert.equal(existsSync(join(ROOT, "pnpm-lock.yaml")), false);
  assert.equal(existsSync(join(ROOT, "bun.lockb")), false);

  const requireFromRoot = createRequire(join(ROOT, "package.json"));
  const resolved = requireFromRoot.resolve(SDK_NAME);
  assert.match(resolved, /node_modules[\\/]posthog-js[\\/]/);

  let dir = dirname(resolved);
  let installed = null;
  const stop = join(ROOT, "node_modules");
  while (dir.startsWith(stop)) {
    const candidate = join(dir, "package.json");
    if (existsSync(candidate)) {
      const parsed = JSON.parse(readFileSync(candidate, "utf8"));
      if (parsed.name === SDK_NAME) {
        installed = parsed;
        break;
      }
    }
    if (dir === stop) break;
    dir = dirname(dir);
  }
  assert.equal(installed?.name, SDK_NAME);
  assert.equal(installed?.version, SDK_VERSION);
});

test("the real browser entry mounts the controller this fixture tests", () => {
  assert.match(entrySource, /from "\.\/lib\/posthog-replay\.mjs"/);
  assert.match(entrySource, /mountPostHogReplay\(\);/);
  assert.equal(typeof mountPostHogReplay, "function");
  assert.equal(typeof createReplayController, "function");
  assert.match(controllerSource, /createReplayController\(\{/);
  assert.match(controllerSource, /import\("posthog-js"\)/);
  assert.ok(existsSync(CONSENT_STORE), "the consent store the controller reads must exist");
});

test("the fixture runs with no project settings and no network", () => {
  const token = process.env.VITE_POSTHOG_PROJECT_TOKEN;
  assert.ok(token === undefined || token === SYNTHETIC_TOKEN, "no real project token may leak in");
  assert.equal(process.env.VITE_POSTHOG_HOST === undefined || process.env.VITE_POSTHOG_HOST === SYNTHETIC_HOST, true);
  assert.deepEqual(networkAttempts, [], "the fixture must not open a network connection");
});

test("missing token or host never initializes the SDK", () => {
  for (const env of [{}, { token: SYNTHETIC_TOKEN }, { host: SYNTHETIC_HOST }, { token: "  ", host: "  " }]) {
    const { controller, sdk, consent } = setup({ env, consentValue: "granted" });
    controller.mount();
    consent.grant();
    assert.equal(sdk.count("init"), 0);
    assert.equal(sdk.count("startSessionRecording"), 0);
    assert.deepEqual(controller.status(), {
      configured: false,
      initialized: false,
      mounted: true,
      optedIn: false,
      recording: false,
    });
  }
});

test("unknown or denied consent never records", () => {
  for (const consentValue of ["unknown", "denied"]) {
    const { controller, sdk, consent, route } = setup({ consentValue });
    controller.mount();
    route.go("/");
    assert.equal(sdk.count("startSessionRecording"), 0, `${consentValue} must not record`);
    assert.equal(sdk.count("opt_in_capturing"), 0);

    consent.deny();
    route.go("/studio");
    assert.equal(sdk.count("startSessionRecording"), 0);
  }
});

test("a safe grant initializes once and starts exactly one masked recording", () => {
  const { controller, sdk, consent } = setup();
  controller.mount();
  assert.equal(sdk.count("init"), 1);

  consent.grant();
  assert.equal(sdk.count("opt_in_capturing"), 1);
  assert.equal(sdk.count("startSessionRecording"), 1);
  assert.deepEqual(sdk.callsTo("startSessionRecording")[0].args, []);
  assert.deepEqual(sdk.callsTo("opt_in_capturing")[0].args, []);

  consent.grant();
  assert.equal(sdk.count("startSessionRecording"), 1);
  assert.equal(sdk.count("init"), 1);

  const [token, config] = sdk.callsTo("init")[0].args;
  assert.equal(token, SYNTHETIC_TOKEN);
  assert.equal(config.api_host, SYNTHETIC_HOST);

  assert.equal(config.opt_out_capturing_by_default, true);
  assert.equal(config.disable_session_recording, true);
  for (const key of [
    "autocapture",
    "capture_pageview",
    "capture_pageleave",
    "capture_dead_clicks",
    "rageclick",
    "capture_exceptions",
    "capture_heatmaps",
    "enable_recording_console_log",
    "capture_performance",
  ]) {
    assert.equal(config[key], false, `${key} must stay off`);
  }

  const recording = config.session_recording;
  assert.equal(recording.maskAllInputs, true);
  assert.equal(recording.maskTextSelector, "*");
  assert.equal(recording.recordBody, false);
  assert.equal(recording.recordHeaders, false);
  assert.deepEqual(recording.captureCanvas, { recordCanvas: false });
  assert.equal(recording.captureJsonLd, false);
  assert.equal(recording.captureCanvas.canvasCapture, undefined);
  assert.match(String(recording.blockSelector), /ph-no-capture/);
  assert.match(String(recording.blockSelector), /\[data-ph-sensitive\]/);
  assert.equal(typeof recording.maskCapturedNetworkRequestFn, "function");
});

test("remounts never duplicate init, start or listeners", () => {
  const { controller, sdk, consent, route } = setup();
  controller.mount();
  consent.grant();
  controller.mount();
  controller.mount();

  assert.equal(sdk.count("init"), 1);
  assert.equal(sdk.count("opt_in_capturing"), 1);
  assert.equal(sdk.count("startSessionRecording"), 1);
  assert.equal(route.listenerCount, 1);
  assert.equal(consent.listenerCount, 1);
});

test("unmount, sensitive routes and withdrawal stop capture", () => {
  const { controller, sdk, consent, route } = setup();
  controller.mount();
  consent.grant();
  assert.equal(controller.status().recording, true);

  route.go("/billing?plan=pro");
  assert.equal(sdk.count("stopSessionRecording"), 1);
  assert.equal(controller.status().recording, false);

  route.go("/checkout/df0d5a3e-1c8a-4f67-9b0d-2f9f1b4c8a11");
  assert.equal(controller.status().recording, false);

  route.go("/");
  assert.equal(controller.status().recording, true);

  consent.withdraw();
  assert.equal(sdk.count("stopSessionRecording"), 2);
  assert.equal(sdk.count("opt_out_capturing"), 1);
  assert.equal(controller.status().optedIn, false);

  route.go("/studio");
  controller.mount();
  assert.equal(controller.status().recording, false);
  assert.equal(sdk.count("startSessionRecording"), 2);
  assert.equal(sdk.count("opt_out_capturing"), 1);

  consent.grant();
  assert.equal(controller.status().recording, true);

  controller.unmount();
  assert.equal(controller.status().recording, false);
  assert.equal(sdk.count("stopSessionRecording"), 3);
  assert.equal(route.listenerCount, 0);
  assert.equal(consent.listenerCount, 0);
});

test("SDK failures never break the studio", () => {
  const broken = setup({ sdk: createSdkStub({ fail: ["init"] }) });
  assert.doesNotThrow(() => broken.controller.mount());
  assert.doesNotThrow(() => broken.consent.grant());
  assert.equal(broken.sdk.count("startSessionRecording"), 0);
  assert.equal(broken.controller.status().initialized, false);

  const flaky = setup({ sdk: createSdkStub({ fail: ["opt_in_capturing", "startSessionRecording"] }) });
  assert.doesNotThrow(() => flaky.controller.mount());
  assert.doesNotThrow(() => flaky.consent.grant());
  assert.doesNotThrow(() => flaky.route.go("/studio"));
  assert.doesNotThrow(() => flaky.controller.unmount());
  assert.equal(flaky.sdk.count("init"), 1);
});

test("the replay URL hook strips secrets and drops unsafe URLs", () => {
  const config = createReplayPrivacyConfig({ host: SYNTHETIC_HOST });
  const hook = config.session_recording.maskCapturedNetworkRequestFn;

  const safe = hook({ name: "https://studio.example.test/api/chat?token=secret-value&q=hello#frag" });
  assert.equal(safe.name, "https://studio.example.test/api/chat");
  assert.doesNotMatch(String(safe.name), /secret-value|\?|#/);

  assert.equal(hook({ name: "https://studio.example.test/?code=auth-code#access-token" }).name, "https://studio.example.test/");
  assert.equal(hook({ name: "/api/me?session=abc#x" }).name, "/api/me");

  for (const unsafe of [
    { name: "http://[::1" },
    { name: "javascript:alert(document.cookie)" },
    { name: "data:text/html,<p>hi</p>" },
    { name: "file:///etc/passwd" },
    { name: "" },
    {},
    null,
    undefined,
    "https://studio.example.test/",
  ]) {
    assert.equal(hook(unsafe), null, `expected a dropped URL for ${JSON.stringify(unsafe)}`);
  }

  for (const blocked of [
    "https://studio.example.test/billing",
    "https://studio.example.test/auth/callback?code=abc",
    "https://studio.example.test/settings/profile",
    "https://studio.example.test/account",
    "https://studio.example.test/u/jane@example.com",
    "https://studio.example.test/portfolios/df0d5a3e-1c8a-4f67-9b0d-2f9f1b4c8a11",
    "https://studio.example.test/invite/AbCdEfGh12345678XyZ",
  ]) {
    assert.equal(hook({ name: blocked }), null, `expected ${blocked} to be blocked`);
    assert.equal(
      isSensitiveReplayPath(blocked.replace(/^https:\/\/studio\.example\.test/, "")),
      true,
      `expected ${blocked} to be a sensitive route`,
    );
  }

  assert.equal(hook({ name: "https://studio.example.test/#/billing" }).name, "https://studio.example.test/");
  assert.equal(isSensitiveReplayPath("#/billing"), true);
  assert.equal(isSensitiveReplayPath("/studio"), false);

  const entry = hook({ name: "https://studio.example.test/studio", duration: 42 });
  assert.deepEqual(entry, { name: "https://studio.example.test/studio", duration: 42 });
  assert.equal(sanitizeReplayUrl(42), null);
});

test("new clients start opted out and existing clients keep their settings", () => {
  const config = createReplayPrivacyConfig({ host: SYNTHETIC_HOST });
  assert.equal(config.opt_out_capturing_by_default, true);
  assert.equal(config.disable_session_recording, true);

  const { controller, sdk, consent } = setup({ sdk: createSdkStub({ loaded: true }) });
  controller.mount();
  consent.grant();
  assert.equal(sdk.count("init"), 0, "an already initialized client is not initialized again");
  assert.equal(sdk.count("startSessionRecording"), 1);
  assert.equal(controller.status().initialized, true);
});

test("the controller never forces recording past ingestion controls", () => {
  assert.doesNotMatch(controllerSource, /startSessionRecording\s*\(\s*[^)\s]/);
  assert.doesNotMatch(controllerSource, /enable_recording_console_log:\s*true/);
  assert.doesNotMatch(controllerSource, /recordBody:\s*true|recordHeaders:\s*true/);
  assert.doesNotMatch(controllerSource, /recordCanvas:\s*true/);
  assert.match(controllerSource, /disable_session_recording: true/);
  assert.match(controllerSource, /opt_out_capturing_by_default: true/);
});

test("changed files carry no live PostHog credential and examples stay empty", () => {
  const files = [
    ...walk(join(ROOT, "src")),
    ...walk(join(ROOT, "tests")),
    join(ROOT, "POSTHOG_REPLAY.md"),
    join(ROOT, ".env.example"),
  ].filter((file) => existsSync(file));

  const liveKey = /\bph[cx]_[A-Za-z0-9]{16,}/;
  for (const file of files) {
    assert.equal(liveKey.test(readFileSync(file, "utf8")), false, `${file} contains a live PostHog key`);
  }

  const example = readFileSync(join(ROOT, ".env.example"), "utf8");
  assert.match(example, /^VITE_POSTHOG_PROJECT_TOKEN=$/m);
  assert.match(example, /^VITE_POSTHOG_HOST=$/m);
});

test("the same checks pass in a child process with an empty environment", () => {
  const logDir = mkdtempSync(join(tmpdir(), "posthog-replay-check-"));
  const logFile = join(logDir, "output.tap");
  const child = spawnSync(process.execPath, ["--test", FILE], {
    env: CHILD_ENV,
    encoding: "utf8",
  });
  writeFileSync(logFile, `${child.stdout ?? ""}${child.stderr ?? ""}`);
  assert.equal(child.status, 0, `the empty-environment run failed; its output is in ${logFile}`);
});

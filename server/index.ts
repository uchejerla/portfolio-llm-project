import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import type { ChatMessage, Portfolio } from "../src/portfolio/types";
import { normalizePortfolio } from "../src/portfolio/normalize";
import { resolveProvider, streamAnthropic, streamOpenAI, ProviderError } from "./providers";
import { SYSTEM_PROMPT, prepareMessages } from "./prompt";
import { extractMessage, extractPortfolio, visibleMessage } from "./parse";
import { buildOfflineReply } from "./offline";
import { denyChatIfRequired, handleApi } from "./api";
import { readConfig } from "./config";
import { openLocalDatabase } from "./db/node";

const app = express();

const providerInfo = resolveProvider(process.env);
const config = readConfig(process.env);
const PORT = Number(process.env.PORT) || 8787;
const db = await openLocalDatabase(
  process.env.STUDIO_DB_PATH || path.resolve(process.cwd(), ".data", "studio.db"),
);

function webRequest(req: ExpressRequest, body?: BodyInit): Request {
  const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(", "));
  }
  headers.delete("host");
  headers.delete("content-length");
  const method = req.method.toUpperCase();
  const requestBody = method === "GET" || method === "HEAD" ? undefined : body;
  return new Request(url, { method, headers, body: requestBody });
}

function sendWebResponse(res: ExpressResponse, response: globalThis.Response): void {
  res.status(response.status);
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") res.setHeader(key, value);
  });
  const cookies =
    (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  if (cookies.length) res.setHeader("set-cookie", cookies);
  if (!response.body) {
    res.end();
    return;
  }
  Readable.fromWeb(response.body as unknown as import("node:stream/web").ReadableStream).pipe(res);
}

// Raw body first: Stripe verifies the exact bytes of the webhook payload.
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json", limit: "512kb" }),
  async (req, res) => {
    try {
      const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
      const response = await handleApi(
        webRequest(req, raw as unknown as BodyInit),
        process.env,
        db,
      );
      if (response) sendWebResponse(res, response);
      else res.status(404).json({ error: "Not found." });
    } catch (error) {
      console.error("Stripe webhook failed", error);
      res.status(500).json({ error: "Webhook processing failed." });
    }
  },
);

app.use(express.json({ limit: "1mb" }));

// Account, auth, billing, and status routes are shared with the Worker.
app.all("/api/*", async (req, res, next) => {
  try {
    const body =
      req.method === "GET" || req.method === "HEAD" || req.body === undefined
        ? undefined
        : JSON.stringify(req.body);
    const response = await handleApi(webRequest(req, body), process.env, db);
    if (!response) {
      next();
      return;
    }
    sendWebResponse(res, response);
  } catch (error) {
    console.error("API request failed", error);
    if (!res.headersSent) res.status(500).json({ error: "The studio hit a server error." });
  }
});

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

function sendEvent(res: ExpressResponse, event: string, data: unknown) {
  if (res.writableEnded) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post("/api/chat", async (req, res) => {
  const denied = await denyChatIfRequired(webRequest(req), process.env, db);
  if (denied) {
    sendWebResponse(res, denied);
    return;
  }

  const body = req.body as {
    messages?: unknown;
    portfolio?: unknown;
  };

  const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
  const messages: Pick<ChatMessage, "role" | "content">[] = rawMessages
    .filter(
      (message): message is { role: "user" | "assistant"; content: string } =>
        Boolean(message) &&
        typeof message === "object" &&
        (message as { role?: unknown }).role !== undefined &&
        ((message as { role: string }).role === "user" ||
          (message as { role: string }).role === "assistant") &&
        typeof (message as { content?: unknown }).content === "string",
    )
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 40_000),
    }));

  if (!messages.length) {
    res.status(400).json({ error: "Send a message so the studio has something to work with." });
    return;
  }

  const portfolio: Portfolio | null =
    body.portfolio && typeof body.portfolio === "object" && !Array.isArray(body.portfolio)
      ? normalizePortfolio(body.portfolio)
      : null;

  res.writeHead(200, SSE_HEADERS);
  res.flushHeaders();

  let closed = false;
  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) {
      closed = true;
      controller.abort();
    }
  });

  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  const prompt = lastUser?.content ?? "Build me a portfolio.";

  if (providerInfo.provider === "offline") {
    await delay(280);
    if (closed) return;
    const reply = buildOfflineReply(prompt, portfolio);
    let visible = "";
    for (const chunk of reply.message.split(/(\s+)/)) {
      if (closed) return;
      visible += chunk;
      sendEvent(res, "text", { text: visible.trimStart() });
      await delay(16);
    }
    if (closed) return;
    sendEvent(res, "portfolio", { portfolio: reply.portfolio });
    sendEvent(res, "done", { message: reply.message, portfolio: reply.portfolio });
    res.end();
    return;
  }

  const prepared = prepareMessages(messages, portfolio);
  let raw = "";
  let sentVisible = "";
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 150_000);

  const onDelta = (delta: string) => {
    raw += delta;
    const visible = visibleMessage(raw);
    if (visible && visible !== sentVisible) {
      sentVisible = visible;
      sendEvent(res, "text", { text: visible });
    }
  };

  try {
    if (providerInfo.provider === "anthropic") {
      await streamAnthropic(
        { system: SYSTEM_PROMPT, messages: prepared, signal: controller.signal },
        providerInfo.model,
        providerInfo.apiKey,
        onDelta,
      );
    } else {
      await streamOpenAI(
        { system: SYSTEM_PROMPT, messages: prepared, signal: controller.signal },
        providerInfo.model,
        providerInfo.apiKey,
        providerInfo.baseUrl,
        onDelta,
      );
    }
  } catch (error) {
    clearTimeout(timeout);
    if (closed) return;
    if (timedOut) {
      sendEvent(res, "error", { message: "The model took too long to answer. Try again." });
      res.end();
      return;
    }
    const message =
      error instanceof ProviderError
        ? error.message
        : "The model connection failed before it could finish. Check the dev server logs.";
    console.error("Chat stream failed:", error);
    sendEvent(res, "error", { message });
    res.end();
    return;
  }
  clearTimeout(timeout);
  if (closed) return;

  const finalText = extractMessage(raw).trim();
  const blueprint = extractPortfolio(raw);

  if (!blueprint) {
    sendEvent(res, "error", {
      message:
        "The model replied without a usable portfolio blueprint. Try rephrasing, or ask it to rebuild the portfolio.",
    });
    res.end();
    return;
  }

  const nextPortfolio = normalizePortfolio(blueprint, portfolio);
  sendEvent(res, "portfolio", { portfolio: nextPortfolio });
  sendEvent(res, "done", {
    message: finalText || "Here's the latest cut — it's live in the studio.",
    portfolio: nextPortfolio,
  });
  res.end();
});

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Portfolio Studio API on http://0.0.0.0:${PORT} · ${providerInfo.provider} (${providerInfo.model})`,
  );
  if (providerInfo.provider === "offline") {
    console.log("No model key found — using the local draft engine. Add ANTHROPIC_API_KEY to .env for Claude.");
  }
  if (!config.authEnabled) {
    console.log("Google sign-in is off. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable accounts.");
  } else if (!config.billingEnabled) {
    console.log("Stripe billing is off. The studio is running without a paywall.");
  } else {
    console.log(`Accounts on · ${config.trialDays}-day trial · ${config.priceLabel}`);
  }
});

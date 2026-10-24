import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Response } from "express";
import type { ChatMessage, Portfolio } from "../src/portfolio/types";
import { normalizePortfolio } from "../src/portfolio/normalize";
import { resolveProvider, streamAnthropic, streamOpenAI, ProviderError } from "./providers";
import { SYSTEM_PROMPT, prepareMessages } from "./prompt";
import { extractMessage, extractPortfolio, visibleMessage } from "./parse";
import { buildOfflineReply } from "./offline";

const app = express();
app.use(express.json({ limit: "1mb" }));

const providerInfo = resolveProvider(process.env);
const PORT = Number(process.env.PORT) || 8787;

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

function sendEvent(res: Response, event: string, data: unknown) {
  if (res.writableEnded) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.get("/api/status", (_req, res) => {
  res.json({
    provider: providerInfo.provider,
    model: providerInfo.model,
    ready: providerInfo.provider !== "offline",
  });
});

app.post("/api/chat", async (req, res) => {
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
});

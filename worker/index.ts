import type { ChatMessage, Portfolio } from "../src/portfolio/types";
import { normalizePortfolio } from "../src/portfolio/normalize";
import { buildOfflineReply } from "../server/offline";
import { extractMessage, extractPortfolio, visibleMessage } from "../server/parse";
import { SYSTEM_PROMPT, prepareMessages } from "../server/prompt";
import {
  ProviderError,
  resolveProvider,
  streamAnthropic,
  streamOpenAI,
  type ProviderEnv,
} from "../server/providers";

interface Env extends ProviderEnv {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

type Send = (event: string, data: unknown) => boolean;

const MAX_BODY = 1_000_000;
const MODEL_TIMEOUT = 120_000;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function incomingMessages(value: unknown): Pick<ChatMessage, "role" | "content">[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-12).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { role, content } = item as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return [];
    return [{ role, content: content.slice(0, 40_000) }];
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function eventStream(
  request: Request,
  run: (send: Send, signal: AbortSignal) => Promise<void>,
): Response {
  const encoder = new TextEncoder();
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (request.signal.aborted) controller.abort();
  else request.signal.addEventListener("abort", onAbort);

  const stream = new ReadableStream<Uint8Array>({
    async start(streamController) {
      let open = true;
      const send: Send = (event, data) => {
        if (controller.signal.aborted || !open) return false;
        try {
          streamController.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
          return true;
        } catch {
          open = false;
          controller.abort();
          return false;
        }
      };

      try {
        await run(send, controller.signal);
      } catch (error) {
        if (!controller.signal.aborted) {
          const message =
            error instanceof ProviderError
              ? error.message
              : "The model connection failed before it could finish. Try again.";
          send("error", { message });
        }
      } finally {
        request.signal.removeEventListener("abort", onAbort);
        try {
          streamController.close();
        } catch {
          // The client already went away.
        }
      }
    },
    cancel() {
      controller.abort();
      request.signal.removeEventListener("abort", onAbort);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-content-type-options": "nosniff",
    },
  });
}

async function handleChat(request: Request, env: Env): Promise<Response> {
  let text: string;
  try {
    text = await request.text();
  } catch {
    return json({ error: "Could not read the request." }, 400);
  }
  if (text.length > MAX_BODY) {
    return json({ error: "That request is too large. Keep the brief under 1 MB." }, 413);
  }

  let body: { messages?: unknown; portfolio?: unknown };
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    return json({ error: "Send a valid JSON request." }, 400);
  }

  const messages = incomingMessages(body.messages);
  if (!messages.length) {
    return json({ error: "Send a message so the studio has something to work with." }, 400);
  }

  const portfolio: Portfolio | null =
    body.portfolio && typeof body.portfolio === "object" && !Array.isArray(body.portfolio)
      ? normalizePortfolio(body.portfolio)
      : null;

  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  const prompt = lastUser?.content ?? "Build me a portfolio.";
  const provider = resolveProvider(env);

  return eventStream(request, async (send, signal) => {
    if (provider.provider === "offline") {
      await delay(220);
      if (signal.aborted) return;
      const reply = buildOfflineReply(prompt, portfolio);
      let visible = "";
      for (const chunk of reply.message.split(/(\s+)/)) {
        if (signal.aborted) return;
        visible += chunk;
        send("text", { text: visible.trimStart() });
        await delay(14);
      }
      if (signal.aborted) return;
      send("portfolio", { portfolio: reply.portfolio });
      send("done", { message: reply.message, portfolio: reply.portfolio });
      return;
    }

    const prepared = prepareMessages(messages, portfolio);
    let raw = "";
    let sentVisible = "";
    let timedOut = false;
    const modelController = new AbortController();
    const onStreamAbort = () => modelController.abort();
    if (signal.aborted) return;
    signal.addEventListener("abort", onStreamAbort);
    const timeout = setTimeout(() => {
      timedOut = true;
      modelController.abort();
    }, MODEL_TIMEOUT);

    const onDelta = (delta: string) => {
      raw += delta;
      const visible = visibleMessage(raw);
      if (visible && visible !== sentVisible) {
        sentVisible = visible;
        send("text", { text: visible });
      }
    };

    try {
      if (provider.provider === "anthropic") {
        await streamAnthropic(
          { system: SYSTEM_PROMPT, messages: prepared, signal: modelController.signal },
          provider.model,
          provider.apiKey,
          onDelta,
        );
      } else {
        await streamOpenAI(
          { system: SYSTEM_PROMPT, messages: prepared, signal: modelController.signal },
          provider.model,
          provider.apiKey,
          provider.baseUrl,
          onDelta,
        );
      }
    } catch (error) {
      if (timedOut) {
        throw new ProviderError("The model took too long to answer. Try again.", 504);
      }
      if (signal.aborted) return;
      throw error;
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener("abort", onStreamAbort);
    }

    if (signal.aborted) return;
    const finalText = extractMessage(raw).trim();
    const blueprint = extractPortfolio(raw);
    if (!blueprint) {
      throw new ProviderError(
        "The model replied without a usable portfolio blueprint. Try rephrasing the brief.",
        502,
      );
    }

    const nextPortfolio = normalizePortfolio(blueprint, portfolio);
    send("portfolio", { portfolio: nextPortfolio });
    send("done", {
      message: finalText || "Here's the latest cut — it's live in the studio.",
      portfolio: nextPortfolio,
    });
  });
}

async function serveAssets(request: Request, env: Env): Promise<Response> {
  const response = await env.ASSETS.fetch(request);
  if (response.status !== 404 || request.method !== "GET") return response;

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (!acceptsHtml) return response;

  const fallback = new URL("/index.html", request.url);
  return env.ASSETS.fetch(new Request(fallback.toString(), { headers: request.headers }));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/status") {
      if (request.method !== "GET") {
        return new Response(JSON.stringify({ error: "Method not allowed." }), {
          status: 405,
          headers: { "content-type": "application/json; charset=utf-8", allow: "GET" },
        });
      }
      const provider = resolveProvider(env);
      return json({
        provider: provider.provider,
        model: provider.model,
        ready: provider.provider !== "offline",
      });
    }

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed." }), {
          status: 405,
          headers: { "content-type": "application/json; charset=utf-8", allow: "POST" },
        });
      }
      return handleChat(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found." }, 404);
    }

    return serveAssets(request, env);
  },
};

import type { ChatMessage, Portfolio, ServerStatus } from "../portfolio/types";
import { normalizePortfolio } from "../portfolio/normalize";

export interface StreamHandlers {
  onText: (text: string) => void;
  onPortfolio: (portfolio: Portfolio) => void;
  onDone: (payload: { message: string; portfolio: Portfolio | null }) => void;
  onError: (message: string) => void;
  onAccessDenied?: (code: "auth_required" | "trial_expired", message: string) => void;
}

export async function fetchStatus(): Promise<ServerStatus | null> {
  try {
    const response = await fetch("/api/status");
    if (!response.ok) return null;
    return (await response.json()) as ServerStatus;
  } catch {
    return null;
  }
}

export async function streamChat(
  payload: {
    messages: Pick<ChatMessage, "role" | "content">[];
    portfolio: Portfolio | null;
    signal: AbortSignal;
  },
  handlers: StreamHandlers,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: payload.messages, portfolio: payload.portfolio }),
      signal: payload.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    handlers.onError("Could not reach the studio server. Is it running?");
    return;
  }

  if (!response.ok || !response.body) {
    let detail = "The studio could not answer that one.";
    let code = "";
    try {
      const parsed = await response.json();
      if (typeof parsed?.error === "string") detail = parsed.error;
      if (typeof parsed?.code === "string") code = parsed.code;
    } catch {
      // keep the friendly fallback
    }
    if ((code === "auth_required" || code === "trial_expired") && handlers.onAccessDenied) {
      handlers.onAccessDenied(code, detail);
      return;
    }
    handlers.onError(detail);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalPortfolio: Portfolio | null = null;
  let finalMessage: string | null = null;
  let failure: string | null = null;

  const consume = (block: string) => {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (!dataLines.length) return;
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(dataLines.join("\n"));
    } catch {
      return;
    }
    if (event === "text" && typeof data.text === "string") {
      handlers.onText(data.text);
    } else if (event === "portfolio" && data.portfolio) {
      finalPortfolio = normalizePortfolio(data.portfolio, payload.portfolio);
      handlers.onPortfolio(finalPortfolio);
    } else if (event === "done") {
      if (typeof data.message === "string") finalMessage = data.message;
      if (data.portfolio) finalPortfolio = normalizePortfolio(data.portfolio, payload.portfolio);
    } else if (event === "error") {
      failure = typeof data.message === "string" ? data.message : "The studio hit a snag.";
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";
      for (const block of blocks) consume(block);
    }
    if (buffer.trim()) consume(buffer);
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    handlers.onError("The connection dropped while writing your portfolio.");
    return;
  }

  if (failure) {
    handlers.onError(failure);
    return;
  }
  handlers.onDone({ message: finalMessage ?? "", portfolio: finalPortfolio });
}

export type ProviderName = "anthropic" | "openai" | "offline";

export interface ProviderMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProviderRequest {
  system: string;
  messages: ProviderMessage[];
  signal: AbortSignal;
}

export interface ProviderEnv {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_BASE_URL?: string;
}

export type ProviderConfig =
  | { provider: "anthropic"; model: string; apiKey: string }
  | { provider: "openai"; model: string; apiKey: string; baseUrl: string }
  | { provider: "offline"; model: string };

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/** Reads model configuration from the Node environment or a Worker binding. */
export function resolveProvider(env: ProviderEnv = {}): ProviderConfig {
  const anthropicKey = env.ANTHROPIC_API_KEY?.trim();
  if (anthropicKey) {
    return {
      provider: "anthropic",
      model: env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5",
      apiKey: anthropicKey,
    };
  }
  const openaiKey = env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return {
      provider: "openai",
      model: env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
      apiKey: openaiKey,
      baseUrl: env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
    };
  }
  return { provider: "offline", model: "local-draft-engine" };
}

async function readSse(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: string, data: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const dispatch = (block: string) => {
    let event = "message";
    const data: string[] = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trim());
    }
    if (data.length) onEvent(event, data.join("\n"));
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      dispatch(block);
      boundary = buffer.indexOf("\n\n");
    }
  }
  if (buffer.trim()) dispatch(buffer);
}

export class ProviderError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function streamAnthropic(
  request: ProviderRequest,
  model: string,
  apiKey: string,
  onDelta: (text: string) => void,
): Promise<void> {
  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.7,
      system: request.system,
      messages: request.messages,
      stream: true,
    }),
    signal: request.signal,
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    console.error("Anthropic request failed", response.status, detail.slice(0, 500));
    throw new ProviderError(
      response.status === 401 || response.status === 403
        ? "Claude rejected the API key. Check ANTHROPIC_API_KEY in the server environment."
        : response.status === 404
          ? "Claude could not find that model. Check ANTHROPIC_MODEL in the server environment."
          : `Claude returned an error (${response.status}). Check your model key and configuration.`,
      response.status,
    );
  }

  await readSse(response.body, (event, data) => {
    if (event !== "content_block_delta") return;
    try {
      const parsed = JSON.parse(data);
      if (parsed?.delta?.type === "text_delta" && typeof parsed.delta.text === "string") {
        onDelta(parsed.delta.text);
      }
    } catch {
      // Ignore malformed keep-alive events.
    }
  });
}

export async function streamOpenAI(
  request: ProviderRequest,
  model: string,
  apiKey: string,
  baseUrl: string,
  onDelta: (text: string) => void,
): Promise<void> {
  const base = (baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
      messages: [{ role: "system", content: request.system }, ...request.messages],
    }),
    signal: request.signal,
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    console.error("OpenAI-compatible request failed", response.status, detail.slice(0, 500));
    throw new ProviderError(
      `The model provider returned an error (${response.status}). Check OPENAI_API_KEY, OPENAI_BASE_URL and OPENAI_MODEL.`,
      response.status,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline = buffer.indexOf("\n");
    while (newline >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line.startsWith("data:")) {
        const payload = line.slice(5).trim();
        if (payload && payload !== "[DONE]") {
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string") onDelta(delta);
          } catch {
            // Ignore partial or non-JSON events.
          }
        }
      }
      newline = buffer.indexOf("\n");
    }
  }
}

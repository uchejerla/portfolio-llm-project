export function visibleMessage(raw: string): string {
  let cut = raw.length;

  const portfolioTag = raw.search(/<\s*\/?\s*portfolio/i);
  if (portfolioTag >= 0) cut = Math.min(cut, portfolioTag);

  const fenceIndex = raw.search(/\n\s*```(?:json)?/i);
  if (fenceIndex >= 0) cut = Math.min(cut, fenceIndex);

  let slice = raw.slice(0, cut);
  slice = slice.replace(/<\s*message\s*>/i, "");
  slice = slice.replace(/<\s*\/\s*message\s*>/i, "");
  slice = slice.replace(/<\s*\/?\s*portfolio[^>]*>/gi, "");
  return slice.trimStart();
}

export function extractMessage(raw: string): string {
  const tagged = raw.match(/<\s*message\s*>([\s\S]*?)<\s*\/\s*message\s*>/i);
  if (tagged?.[1]) return tagged[1].trim();
  let text = raw;
  const cut = text.search(/<\s*portfolio/i);
  if (cut >= 0) text = text.slice(0, cut);
  text = text.replace(/```[\s\S]*$/, "");
  text = text.replace(/<\s*\/?\s*message\s*>/gi, "");
  return text.trim();
}

function tryParse(candidate: string): unknown | null {
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function balancedObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < raw.length; index += 1) {
    const char = raw[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return raw.slice(start, index + 1);
    }
  }
  return null;
}

export function extractPortfolio(raw: string): unknown | null {
  const tagged = [...raw.matchAll(/<\s*portfolio\s*>([\s\S]*?)<\s*\/\s*portfolio\s*>/gi)];
  for (const match of tagged.reverse()) {
    const parsed = tryParse(match[1].trim());
    if (parsed) return parsed;
  }

  const fences = [...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for (const match of fences.reverse()) {
    const parsed = tryParse(match[1].trim());
    if (parsed) return parsed;
  }

  if (raw.includes("<portfolio")) {
    const afterTag = raw.slice(raw.indexOf("<portfolio") + 10).replace(/^[^>]*>/, "");
    const balanced = balancedObject(afterTag);
    if (balanced) {
      const parsed = tryParse(balanced);
      if (parsed) return parsed;
    }
  }

  const balanced = balancedObject(raw);
  return balanced ? tryParse(balanced) : null;
}

export function extractJsonObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

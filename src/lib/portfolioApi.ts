import type { Portfolio } from "../portfolio/types";
import { normalizePortfolio } from "../portfolio/normalize";

export interface StoredPortfolio {
  id: string;
  title: string;
  portfolio: Portfolio;
  createdAt: number;
  updatedAt: number;
  expiresAt: number | null;
}

export class PortfolioApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PortfolioApiError";
    this.status = status;
  }
}

function readProject(value: unknown): StoredPortfolio | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || !raw.portfolio || typeof raw.portfolio !== "object") {
    return null;
  }
  return {
    id: raw.id,
    title: typeof raw.title === "string" ? raw.title : "",
    portfolio: normalizePortfolio(raw.portfolio),
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now(),
    expiresAt: typeof raw.expiresAt === "number" ? raw.expiresAt : null,
  };
}

export async function listPortfolios(): Promise<{
  projects: StoredPortfolio[];
  expiredIds: string[];
} | null> {
  try {
    const response = await fetch("/api/portfolios", {
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { projects?: unknown; expiredIds?: unknown };
    const projects = Array.isArray(data.projects)
      ? data.projects.flatMap((item) => {
          const project = readProject(item);
          return project ? [project] : [];
        })
      : [];
    const expiredIds = Array.isArray(data.expiredIds)
      ? data.expiredIds.filter((id): id is string => typeof id === "string")
      : [];
    return { projects, expiredIds };
  } catch {
    return null;
  }
}

export async function savePortfolio(
  id: string,
  title: string,
  portfolio: Portfolio,
): Promise<StoredPortfolio> {
  const response = await fetch(`/api/portfolios/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ title, portfolio }),
  });

  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    // The status below carries enough information.
  }
  if (!response.ok) {
    throw new PortfolioApiError(
      typeof data.error === "string" ? data.error : "The portfolio could not be saved.",
      response.status,
    );
  }

  const project = readProject(data.project);
  if (!project) throw new PortfolioApiError("The server returned an unreadable portfolio.", 502);
  return project;
}

export async function deletePortfolio(id: string): Promise<void> {
  try {
    await fetch(`/api/portfolios/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch {
    // A missed delete is retried by the next save or expiry purge.
  }
}

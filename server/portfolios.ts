import type { Portfolio } from "../src/portfolio/types";
import { normalizePortfolio } from "../src/portfolio/normalize";
import type { AccountPlan } from "./account";
import { DAY_MS } from "./account";
import { PORTFOLIO_TRIAL_DAYS } from "./config";
import type { Database } from "./db/types";

export interface PortfolioRow {
  id: string;
  user_id: string;
  title: string;
  data: string;
  created_at: number;
  updated_at: number;
  expires_at: number | null;
}

export interface StoredPortfolio {
  id: string;
  title: string;
  portfolio: Portfolio;
  createdAt: number;
  updatedAt: number;
  expiresAt: number | null;
}

export type SavePortfolioResult =
  | { ok: true; project: StoredPortfolio }
  | { ok: false; reason: "expired" | "conflict" };

/** Trial work lasts 14 days from creation; Pro work has no expiry. */
export function portfolioExpiry(
  plan: AccountPlan,
  billingEnabled: boolean,
  createdAt: number,
): number | null {
  if (!billingEnabled || plan === "pro") return null;
  return createdAt + PORTFOLIO_TRIAL_DAYS * DAY_MS;
}

function storedFromRow(row: PortfolioRow): StoredPortfolio | null {
  let value: unknown;
  try {
    value = JSON.parse(row.data);
  } catch {
    return null;
  }
  const portfolio = normalizePortfolio(value);
  return {
    id: row.id,
    title: row.title || portfolio.name,
    portfolio,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
  };
}

/**
 * Removes anything already past its trial clock, then returns the surviving
 * records. The expired ids let the browser delete its own copy immediately, so
 * an expired portfolio cannot be restored from local storage.
 */
export async function listPortfolios(
  db: Database,
  userId: string,
  options: { keepForever: boolean; now?: number },
): Promise<{ projects: StoredPortfolio[]; expiredIds: string[] }> {
  const now = options.now ?? Date.now();
  const expired = await db.all<{ id: string }>(
    "SELECT id FROM portfolios WHERE user_id = ? AND expires_at IS NOT NULL AND expires_at <= ?",
    userId,
    now,
  );
  if (expired.length) {
    for (const row of expired) {
      await db.run(
        "INSERT OR IGNORE INTO expired_portfolios (id, user_id, expired_at) VALUES (?, ?, ?)",
        row.id,
        userId,
        now,
      );
    }
    await db.run(
      "DELETE FROM portfolios WHERE user_id = ? AND expires_at IS NOT NULL AND expires_at <= ?",
      userId,
      now,
    );
  }
  if (options.keepForever) {
    await db.run(
      "UPDATE portfolios SET expires_at = NULL WHERE user_id = ? AND expires_at IS NOT NULL",
      userId,
    );
  }

  const rows = await db.all<PortfolioRow>(
    "SELECT * FROM portfolios WHERE user_id = ? ORDER BY updated_at DESC",
    userId,
  );
  const projects = rows.flatMap((row) => {
    const project = storedFromRow(row);
    return project ? [project] : [];
  });
  return { projects, expiredIds: expired.map((row) => row.id) };
}

export async function savePortfolio(
  db: Database,
  userId: string,
  input: {
    id: string;
    title: string;
    portfolio: Portfolio;
    keepForever: boolean;
    now?: number;
  },
): Promise<SavePortfolioResult> {
  const now = input.now ?? Date.now();
  const portfolio = normalizePortfolio(input.portfolio);
  const title = input.title.trim().slice(0, 120) || portfolio.name;
  const data = JSON.stringify(portfolio);

  const tombstone = await db.first<{ id: string }>(
    "SELECT id FROM expired_portfolios WHERE id = ? AND user_id = ?",
    input.id,
    userId,
  );
  if (tombstone) return { ok: false, reason: "expired" };

  const existing = await db.first<PortfolioRow>(
    "SELECT * FROM portfolios WHERE id = ?",
    input.id,
  );
  if (existing) {
    if (existing.user_id !== userId) return { ok: false, reason: "conflict" };
    if (existing.expires_at !== null && existing.expires_at <= now) {
      await db.run(
        "INSERT OR IGNORE INTO expired_portfolios (id, user_id, expired_at) VALUES (?, ?, ?)",
        input.id,
        userId,
        now,
      );
      await db.run("DELETE FROM portfolios WHERE id = ? AND user_id = ?", input.id, userId);
      return { ok: false, reason: "expired" };
    }

    const expiresAt = input.keepForever ? null : existing.expires_at;
    await db.run(
      `UPDATE portfolios SET title = ?, data = ?, updated_at = ?, expires_at = ?
        WHERE id = ? AND user_id = ?`,
      title,
      data,
      now,
      expiresAt,
      input.id,
      userId,
    );
    return {
      ok: true,
      project: {
        id: input.id,
        title,
        portfolio,
        createdAt: existing.created_at,
        updatedAt: now,
        expiresAt,
      },
    };
  }

  const expiresAt = input.keepForever ? null : portfolioExpiry("trial", true, now);
  try {
    await db.run(
      `INSERT INTO portfolios (id, user_id, title, data, created_at, updated_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      input.id,
      userId,
      title,
      data,
      now,
      now,
      expiresAt,
    );
  } catch {
    // Another account claimed this id between the lookup and the insert.
    return { ok: false, reason: "conflict" };
  }

  return {
    ok: true,
    project: {
      id: input.id,
      title,
      portfolio,
      createdAt: now,
      updatedAt: now,
      expiresAt,
    },
  };
}

export async function deletePortfolio(
  db: Database,
  userId: string,
  id: string,
): Promise<void> {
  await db.run("DELETE FROM portfolios WHERE id = ? AND user_id = ?", id, userId);
}

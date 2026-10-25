import type { Database } from "./types";

export const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_sub TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    trial_ends_at INTEGER NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT NOT NULL DEFAULT 'none',
    current_period_end INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id)`,
  `CREATE TABLE IF NOT EXISTS billing_events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS portfolios (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    expires_at INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS portfolios_user_idx ON portfolios (user_id)`,
  `CREATE INDEX IF NOT EXISTS portfolios_expiry_idx ON portfolios (expires_at)`,
  `CREATE TABLE IF NOT EXISTS expired_portfolios (
    id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    expired_at INTEGER NOT NULL,
    PRIMARY KEY (id, user_id)
  )`,
];

export async function ensureSchema(db: Database): Promise<void> {
  for (const statement of SCHEMA) {
    await db.run(statement);
  }
}

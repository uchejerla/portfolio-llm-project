export type SqlValue = string | number | null;

/** The tiny query surface shared by D1 (Workers) and SQLite (local Node). */
export interface Database {
  first<T>(query: string, ...params: SqlValue[]): Promise<T | null>;
  all<T>(query: string, ...params: SqlValue[]): Promise<T[]>;
  run(query: string, ...params: SqlValue[]): Promise<void>;
}

export interface UserRecord {
  id: string;
  google_sub: string;
  email: string;
  name: string;
  avatar_url: string;
  trial_ends_at: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  current_period_end: number | null;
  created_at: number;
  updated_at: number;
}

export interface SessionRecord {
  token_hash: string;
  user_id: string;
  expires_at: number;
  created_at: number;
}

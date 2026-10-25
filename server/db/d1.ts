import type { Database, SqlValue } from "./types";
import { ensureSchema } from "./schema";

interface D1Result<T> {
  results?: T[];
}

interface D1PreparedStatement {
  bind(...params: SqlValue[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<unknown>;
}

/** The subset of the Cloudflare D1 binding this app depends on. */
export interface D1Like {
  prepare(query: string): D1PreparedStatement;
}

export function d1Database(database: D1Like): Database {
  return {
    async first<T>(query: string, ...params: SqlValue[]): Promise<T | null> {
      return database.prepare(query).bind(...params).first<T>();
    },
    async all<T>(query: string, ...params: SqlValue[]): Promise<T[]> {
      const result = await database.prepare(query).bind(...params).all<T>();
      return result.results ?? [];
    },
    async run(query: string, ...params: SqlValue[]): Promise<void> {
      await database.prepare(query).bind(...params).run();
    },
  };
}

const schemaReady = new WeakMap<object, Promise<void>>();

/** Runs the schema once per isolate, no matter how many requests arrive. */
export function prepareD1(database: D1Like): Promise<Database> {
  const adapter = d1Database(database);
  let ready = schemaReady.get(database);
  if (!ready) {
    ready = ensureSchema(adapter);
    schemaReady.set(database, ready);
  }
  return ready.then(() => adapter);
}

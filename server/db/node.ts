import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { Database as StudioDatabase, SqlValue } from "./types";
import { ensureSchema } from "./schema";

export interface LocalDatabase extends StudioDatabase {
  close(): void;
}

/** Local development and tests use SQLite; deployed Workers use D1. */
export function createLocalDatabase(file: string): LocalDatabase {
  if (file !== ":memory:") {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const sqlite = new Database(file);
  if (file !== ":memory:") sqlite.pragma("journal_mode = WAL");

  return {
    async first<T>(query: string, ...params: SqlValue[]): Promise<T | null> {
      return (sqlite.prepare(query).get(...params) as T | undefined) ?? null;
    },
    async all<T>(query: string, ...params: SqlValue[]): Promise<T[]> {
      return sqlite.prepare(query).all(...params) as T[];
    },
    async run(query: string, ...params: SqlValue[]): Promise<void> {
      sqlite.prepare(query).run(...params);
    },
    close() {
      sqlite.close();
    },
  };
}

export async function openLocalDatabase(file: string): Promise<LocalDatabase> {
  const db = createLocalDatabase(file);
  await ensureSchema(db);
  return db;
}

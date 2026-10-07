import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SCHEMA_SQL } from "./schema.ts";

const globalForDatabase = globalThis as unknown as { becasDatabase?: DatabaseSync };

export function getDatabasePath() {
  return process.env.SCHOLARSHIP_DB_PATH?.trim() || path.join(process.cwd(), "data", "becas.sqlite");
}

export function getDatabase() {
  if (globalForDatabase.becasDatabase) {
    return globalForDatabase.becasDatabase;
  }

  const filePath = getDatabasePath();
  mkdirSync(path.dirname(filePath), { recursive: true });

  const database = new DatabaseSync(filePath, { timeout: 5000 });
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA journal_mode = DELETE");
  database.exec(SCHEMA_SQL);
  globalForDatabase.becasDatabase = database;
  return database;
}

export function closeDatabase() {
  globalForDatabase.becasDatabase?.close();
  globalForDatabase.becasDatabase = undefined;
}

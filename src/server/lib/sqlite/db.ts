import { Database as BunDatabase } from "bun:sqlite";
import { getStadenRoot } from "../env/stadenRoot";
import { logDebug } from "@/shared/logger";

let db: BunDatabase | undefined;
let readonlyDb: BunDatabase | undefined;
let databaseConstructorForTests: typeof BunDatabase | undefined;

export async function open() {
  if (db) {
    return db;
  }

  const stadenRoot = getStadenRoot();
  const Database = await loadDatabaseConstructor();
  db = configureDatabase(new Database(`${stadenRoot}/vault.sqlite3`));
  return db;
}

export async function close() {
  if (!db) {
    if (!readonlyDb) {
      return;
    }
  }

  if (db) {
    db.close();
    db = undefined;
  }

  if (readonlyDb) {
    readonlyDb.close();
    readonlyDb = undefined;
  }
}

export function getDb(): BunDatabase {
  if (!db) {
    const stadenRoot = getStadenRoot();
    const Database = loadDatabaseConstructor();
    db = configureDatabase(new Database(`${stadenRoot}/vault.sqlite3`));
  }

  return db;
}

export function getReadonlyDb(): BunDatabase {
  if (!readonlyDb) {
    const stadenRoot = getStadenRoot();
    const Database = loadDatabaseConstructor();
    readonlyDb = new Database(`${stadenRoot}/vault.sqlite3`, {
      readonly: true,
    });
  }

  return readonlyDb;
}

export function __setDatabaseConstructorForTests(
  constructor: typeof BunDatabase | undefined,
): void {
  databaseConstructorForTests = constructor;
}

export function __resetDbForTests(): void {
  db = undefined;
  readonlyDb = undefined;
}

export function logSqliteQuery(sql: string, params: readonly unknown[]): void {
  logDebug(
    "sqlite.query:",
    sql.replace(/[\n\r]\s*/g, " ").replace(/^\s*/g, " "),
    { params },
  );
}

function loadDatabaseConstructor(): typeof BunDatabase {
  if (databaseConstructorForTests) {
    return databaseConstructorForTests;
  }
  return BunDatabase;
}

function configureDatabase(database: BunDatabase): BunDatabase {
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec("PRAGMA journal_mode = WAL;");
  return database;
}

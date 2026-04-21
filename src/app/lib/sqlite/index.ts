import { Database as BunDatabase } from "bun:sqlite";
import { getStadenRoot } from "../env/stadenRoot";
import { logDebug, logError } from "../logger";

import { initializeLinks } from "./links";
import { initializeBlocks } from "./blocks";
import { initializePages } from "./pages";

export * from "./pages";
export * from "./blocks";
export * from "./links";

type SqliteStatement = {
  all: (...params: unknown[]) => any[];
  get: (...params: unknown[]) => unknown;
  run: (...params: unknown[]) => { lastInsertRowid: number; changes: number };
};

type SqliteDatabase = {
  prepare: (sql: string) => SqliteStatement;
  exec: (sql: string) => unknown;
  transaction: <T extends (...args: any[]) => any>(
    callback: T,
  ) => T & {
    deferred: T;
    immediate: T;
    exclusive: T;
  };
  close: () => void;
};

type SqliteDatabaseConstructor = new (filename: string) => SqliteDatabase;

let db: SqliteDatabase | undefined;
let databaseConstructorForTests: SqliteDatabaseConstructor | undefined;

export function initializeAllTables() {
  const database = getDb();
  initializeLinks();
  initializeBlocks();
  initializePages();
  database.exec(`
    DROP VIEW IF EXISTS blocks_p;
    CREATE VIEW blocks_p AS
    SELECT
      blocks.*, pages.title as page_title, pages.path as page_path
    FROM blocks
    JOIN pages ON blocks.page_id = pages.id;
  `);
}

export async function query(
  sql: string,
  params: unknown[] = [],
): Promise<any[]> {
  logDebug(
    "sqlite.query:",
    sql.replace(/[\n\r]\s*/g, " ").replace(/^\s*/g, " "),
    { paramCount: params.length },
  );
  try {
    const database = getDb();
    return database.prepare(sql).all(...params);
  } catch (e) {
    logError("Error executing query:", e);
    throw e;
  }
}

export async function open() {
  if (db) {
    return db;
  }

  const stadenRoot = getStadenRoot();
  const Database = await loadDatabaseConstructor();
  db = new Database(`${stadenRoot}/vault.sqlite3`);
  return db;
}

export async function close() {
  if (!db) {
    return;
  }

  db.close();
  db = undefined;
}

export function getDb(): SqliteDatabase {
  if (!db) {
    const stadenRoot = getStadenRoot();
    const Database = loadDatabaseConstructor();
    db = new Database(`${stadenRoot}/vault.sqlite3`);
  }

  return db;
}

export function __setDatabaseConstructorForTests(
  constructor: SqliteDatabaseConstructor | undefined,
): void {
  databaseConstructorForTests = constructor;
}

export function __resetDbForTests(): void {
  db = undefined;
}

function loadDatabaseConstructor(): SqliteDatabaseConstructor {
  if (databaseConstructorForTests) {
    return databaseConstructorForTests;
  }
  return BunDatabase as unknown as SqliteDatabaseConstructor;
}

import { createRequire } from "node:module";

import { getStadenRoot } from "../env/stadenRoot";

import { initializeLinks } from "./links";
import { initializeBlocks } from "./blocks";
import { initializePages } from "./pages";

export * from "./pages";
export * from "./blocks";
export * from "./links";

const nodeRequire = createRequire(`${process.cwd()}/package.json`);

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
  console.log(
    "sqlite.query:",
    sql.replace(/[\n\r]\s*/g, " ").replace(/^\s*/g, " "),
    params,
  );
  try {
    const database = getDb();
    return database.prepare(sql).all(...params);
  } catch (e) {
    console.error("Error executing query:", e);
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
    if (isBunRuntime()) {
      throw new Error(
        "SQLite database is not initialized. Call await open() before handling requests.",
      );
    }

    const stadenRoot = getStadenRoot();
    const Database = loadNodeDatabaseConstructor();
    db = new Database(`${stadenRoot}/vault.sqlite3`);
  }

  return db;
}

export function __setDatabaseConstructorForTests(
  constructor: SqliteDatabaseConstructor | undefined,
): void {
  databaseConstructorForTests = constructor;
}

function isBunRuntime(): boolean {
  return (
    typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
    Boolean(process.versions?.bun)
  );
}

function loadNodeDatabaseConstructor(): SqliteDatabaseConstructor {
  if (databaseConstructorForTests) {
    return databaseConstructorForTests;
  }

  const databaseModule = nodeRequire("better-sqlite3") as
    | SqliteDatabaseConstructor
    | {
        default: SqliteDatabaseConstructor;
      };
  return typeof databaseModule === "function"
    ? databaseModule
    : databaseModule.default;
}

async function loadDatabaseConstructor(): Promise<SqliteDatabaseConstructor> {
  if (!isBunRuntime()) {
    return loadNodeDatabaseConstructor();
  }

  const databaseModule = await import("bun:sqlite");
  return databaseModule.Database as unknown as SqliteDatabaseConstructor;
}

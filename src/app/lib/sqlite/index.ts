import { Database as BunDatabase } from "bun:sqlite";
import { getStadenRoot } from "../env/stadenRoot";
import { logDebug } from "../logger";

import { initializeLinks } from "./links";
import { initializeBlocks } from "./blocks";
import { initializePages } from "./pages";

export * from "./pages";
export * from "./blocks";
export * from "./links";

let db: BunDatabase | undefined;
let databaseConstructorForTests: typeof BunDatabase | undefined;

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

export function getDb(): BunDatabase {
  if (!db) {
    const stadenRoot = getStadenRoot();
    const Database = loadDatabaseConstructor();
    db = new Database(`${stadenRoot}/vault.sqlite3`);
  }

  return db;
}

export function __setDatabaseConstructorForTests(
  constructor: typeof BunDatabase | undefined,
): void {
  databaseConstructorForTests = constructor;
}

export function __resetDbForTests(): void {
  db = undefined;
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

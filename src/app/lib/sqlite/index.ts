import Database from "better-sqlite3";

import { getStadenRoot } from "../env/stadenRoot";

import { initializeLinks } from "./links";
import { initializeBlocks } from "./blocks";
import { initializePages } from "./pages";

export * from "./pages";
export * from "./blocks";
export * from "./links";

let db: Database.Database | undefined;
let hasRegisteredFunctions = false;

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
  db = new Database(`${stadenRoot}/vault.sqlite3`);
  registerFunctions(db);
  return db;
}

export async function close() {
  if (!db) {
    return;
  }

  db.close();
  db = undefined;
  hasRegisteredFunctions = false;
}

export function getDb(): Database.Database {
  if (!db) {
    const stadenRoot = getStadenRoot();
    db = new Database(`${stadenRoot}/vault.sqlite3`);
  }

  registerFunctions(db);
  return db;
}

function registerFunctions(database: Database.Database): void {
  if (hasRegisteredFunctions) {
    return;
  }

  database.function("regex_capture", (str: string, regex: string) => {
    const re = new RegExp(regex);
    const match = str.match(re);
    const result = [];
    for (let i = 1; i < (match?.length || 0); i++) {
      if (match?.[i] === undefined) {
        result.push(null);
      } else {
        result.push(match[i]);
      }
    }
    return JSON.stringify(result);
  });
  hasRegisteredFunctions = true;
}

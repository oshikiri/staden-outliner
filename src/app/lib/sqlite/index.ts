import Database from "better-sqlite3";

import { getStadenRoot } from "../env/stadenRoot";

export let db: Database.Database;
// RV: Global mutable DB handle can cause race conditions in a serverless/concurrent environment; consider connection-per-request or a pool.

import { initializeLinks } from "./links";
import { initializeBlocks } from "./blocks";
import { initializePages } from "./pages";

export * from "./pages";
export * from "./blocks";
export * from "./links";

export function initializeAllTables() {
  initializeLinks();
  initializeBlocks();
  initializePages();
  db.exec(`
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  console.log(
    "sqlite.query:",
    sql.replace(/[\n\r]\s*/g, " ").replace(/^\s*/g, " "),
    params,
  );
  try {
    await open();
    db.function("regex_capture", (str: string, regex: string) => {
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
    return db.prepare(sql).all(...params);
  } catch (e) {
    console.error("Error executing query:", e);
    throw e;
  }
}

export async function open() {
  const stadenRoot = getStadenRoot();
  db = new Database(`${stadenRoot}/vault.sqlite3`);
}

export async function close() {
  db.close();
}

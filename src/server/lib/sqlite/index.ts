export * from "./db";
import { getDb } from "./db";
import { initializeLinks } from "./links";
import { initializeBlocks } from "./blocks";
import { initializePages } from "./pageStore";

export * from "./pageStore";
export * from "./blocks";
export * from "./links";

const SCHEMA_VERSION = 1;

export function initializeAllTables() {
  const database = getDb();
  const initializeAllTablesTx = database.transaction(() => {
    const currentVersion = getSchemaVersion(database);
    if (currentVersion > SCHEMA_VERSION) {
      throw new Error(
        `Unsupported sqlite schema version: ${currentVersion} > ${SCHEMA_VERSION}`,
      );
    }

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

    if (currentVersion < SCHEMA_VERSION) {
      setSchemaVersion(database, SCHEMA_VERSION);
    }
  });
  initializeAllTablesTx();
}

export function clearAllData() {
  const database = getDb();
  const clearAllDataTx = database.transaction(() => {
    database.exec(`
      DELETE FROM links;
      DELETE FROM blocks;
      DELETE FROM pages;
    `);
  });
  clearAllDataTx();
}

function getSchemaVersion(database: ReturnType<typeof getDb>): number {
  const row = database.query("PRAGMA user_version;").get() as
    | { user_version: number }
    | undefined;
  return row?.user_version ?? 0;
}

function setSchemaVersion(
  database: ReturnType<typeof getDb>,
  version: number,
): void {
  database.exec(`PRAGMA user_version = ${version};`);
}

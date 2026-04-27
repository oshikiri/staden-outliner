export * from "./db";
import { getDb } from "./db";
import { initializeLinks } from "./links";
import { initializeBlocks } from "./blocks";
import { initializePages } from "./pageStore";

export * from "./pageStore";
export * from "./blocks";
export * from "./links";

export function initializeAllTables() {
  const database = getDb();
  const initializeAllTablesTx = database.transaction(() => {
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
  });
  initializeAllTablesTx();
}

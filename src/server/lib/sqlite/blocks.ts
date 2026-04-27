import { Block } from "@/shared/markdown";
import { chunk } from "@/shared/lodash";
import { getDb, logSqliteQuery } from "./db";
import {
  BlockRecord,
  BlockInsertOptions,
  BlockInsertRecord,
  createPageBlockFromRows,
  toBlockInsertRecord,
} from "./blockRecordMapper";
import { logInfo } from "@/shared/logger";

export function initializeBlocks() {
  const db = getDb();
  db.exec("DROP TABLE IF EXISTS blocks");
  db.exec(
    `CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      page_id TEXT,
      parent_id TEXT,
      depth INTEGER,
      order_index INTEGER DEFAULT 0,
      content TEXT,
      content_markdown TEXT,
      properties TEXT
    )`,
  );
}

export async function getPageBlockById(pageId: string): Promise<Block> {
  const sql = `
    SELECT blocks.*, pages.title AS page_title
    FROM blocks
    LEFT JOIN pages ON pages.id = blocks.page_id
    WHERE pages.id = ?;
  `;
  logSqliteQuery(sql, [pageId]);
  const blocks = getDb().query<BlockRecord, string>(sql).all(pageId);

  const rootBlock = createPageBlockFromRows(blocks);
  return rootBlock;
}

export async function getPageBlockByTitle(
  title: string,
): Promise<Block | undefined> {
  const sql = `
    SELECT blocks.*, pages.title AS page_title
    FROM blocks
    LEFT JOIN pages ON pages.id = blocks.page_id
    WHERE pages.title = ?;
  `;
  logSqliteQuery(sql, [title]);
  const blocks = getDb().query<BlockRecord, string>(sql).all(title);

  if (blocks.length == 0) {
    return undefined;
  }

  const rootBlock = createPageBlockFromRows(blocks);
  return rootBlock;
}

/**
 * Get block by id with all its children
 */
export async function getBlockById(id: string): Promise<Block> {
  const rootBlock = await getCurrentPage(id);
  return rootBlock.getBlockById(id)!;
}

export async function getCurrentPage(childId: string): Promise<Block> {
  const sql = `
    SELECT blocks.*, pages.title AS page_title
    FROM blocks
    LEFT JOIN pages ON pages.id = blocks.page_id
    WHERE blocks.page_id = (SELECT page_id FROM blocks WHERE id = ?);
  `;
  logSqliteQuery(sql, [childId]);
  const blocks = getDb().query<BlockRecord, string>(sql).all(childId);
  if (blocks.length == 0) {
    throw new Error(`Block not found for pageId: ${childId}`);
  }
  const rootBlock = createPageBlockFromRows(blocks);
  return rootBlock;
}

export function batchInsertBlocks(
  blocks: Block[],
  BATCH_SIZE: number,
  options: BlockInsertOptions = {},
) {
  let i = 0;
  for (const batch of chunk(Array.from(blocks), BATCH_SIZE)) {
    logInfo(
      `Importing batch ${i + 1} of ${Math.ceil(blocks.length / BATCH_SIZE)}`,
    );
    i++;
    batchInsertBlock(batch, options);
  }
}

function batchInsertBlock(blocks: Block[], options: BlockInsertOptions) {
  const db = getDb();
  const insert = db.prepare<unknown, BlockInsertRecord>(`
    REPLACE INTO blocks
      (id, page_id, parent_id, depth, order_index, content, content_markdown, properties)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((blocks: Block[]) => {
    for (const block of blocks) {
      const record = toBlockInsertRecord(block, options);
      if (!record) {
        continue;
      }

      insert.run(...record);
    }
  });
  insertMany(blocks);
}

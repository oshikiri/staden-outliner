import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Database as BunDatabase } from "bun:sqlite";

import * as blocks from "./blocks";

let db: BunDatabase;

describe("blocks", () => {
  beforeEach(() => {
    db = new BunDatabase(":memory:");
    db.exec(`
      CREATE TABLE IF NOT EXISTS blocks (
        id TEXT PRIMARY KEY,
        page_id TEXT,
        parent_id TEXT,
        depth INTEGER,
        order_index INTEGER DEFAULT 0,
        content TEXT,
        content_markdown TEXT,
        properties TEXT
      );
    `);
  });

  afterEach(() => {
    db.close();
  });

  test("initializeBlocks keeps existing rows", () => {
    db.exec(`
      INSERT INTO blocks (
        id, page_id, parent_id, depth, order_index, content, content_markdown, properties
      ) VALUES ('block-a', 'page-a', NULL, 0, 0, '[]', '', '[]')
    `);

    blocks.initializeBlocks(db);

    const rows = db
      .query(
        "SELECT id, page_id, parent_id, depth, order_index, content, content_markdown, properties FROM blocks ORDER BY id",
      )
      .all() as Array<{
      id: string;
      page_id: string | null;
      parent_id: string | null;
      depth: number | null;
      order_index: number | null;
      content: string | null;
      content_markdown: string | null;
      properties: string | null;
    }>;
    expect(rows).toEqual([
      {
        id: "block-a",
        page_id: "page-a",
        parent_id: null,
        depth: 0,
        order_index: 0,
        content: "[]",
        content_markdown: "",
        properties: "[]",
      },
    ]);
  });

  test("initializeBlocks creates indexes for page and parent lookups", () => {
    blocks.initializeBlocks(db);

    const indexes = db
      .query(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'blocks' ORDER BY name",
      )
      .all() as Array<{ name: string }>;
    expect(indexes.map((index) => index.name)).toContain("idx_blocks_page_id");
    expect(indexes.map((index) => index.name)).toContain(
      "idx_blocks_parent_id",
    );
  });
});

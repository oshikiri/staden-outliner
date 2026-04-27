import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Database as BunDatabase } from "bun:sqlite";

let db: BunDatabase;
let linksModule: typeof import("./links");
let importCounter = 0;

async function loadLinksModule() {
  const module = await import(`./links.ts?test=${importCounter++}`);
  linksModule = module;
}

function setupSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT,
      path TEXT
    );
  `);
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
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      from_id TEXT,
      to_id TEXT,
      FOREIGN KEY (from_id) REFERENCES blocks(id),
      FOREIGN KEY (to_id) REFERENCES blocks(id)
    );
  `);
  db.exec(`
    CREATE VIEW IF NOT EXISTS blocks_p AS
    SELECT
      blocks.*, pages.title AS page_title, pages.path AS page_path
    FROM blocks
    JOIN pages ON blocks.page_id = pages.id;
  `);
}

describe.serial("links", () => {
  beforeEach(async () => {
    db = new BunDatabase(":memory:");
    setupSchema();
    await loadLinksModule();
  });

  afterEach(() => {
    db.close();
  });

  test("initializeLinks recreates the table", () => {
    db.exec("INSERT INTO links VALUES ('from-a', 'to-a')");

    linksModule.initializeLinks(db);

    const rows = db.query("SELECT * FROM links").all();
    expect(rows).toEqual([]);
  });

  test("getSourceLinks returns from_id values for a target page", async () => {
    db.exec(
      "INSERT INTO pages (id, title, path) VALUES ('page-target', 'Target', NULL)",
    );
    db.exec(
      "INSERT INTO blocks (id, page_id, parent_id, depth, content, content_markdown, properties) VALUES ('block-target', 'page-target', NULL, 0, '[]', '', '[]')",
    );
    db.exec(
      "INSERT INTO links (from_id, to_id) VALUES ('block-a', 'block-target')",
    );
    db.exec(
      "INSERT INTO links (from_id, to_id) VALUES ('block-b', 'block-target')",
    );

    const result = await linksModule.getSourceLinks("Target", db);

    expect(result).toEqual(["block-a", "block-b"]);
  });

  test("deleteLinksByFromId deletes matching rows", () => {
    db.exec(
      "INSERT INTO links (from_id, to_id) VALUES ('block-a', 'block-target')",
    );
    db.exec(
      "INSERT INTO links (from_id, to_id) VALUES ('block-b', 'block-target')",
    );

    linksModule.deleteLinksByFromId("block-a", db);

    const rows = db
      .query("SELECT from_id FROM links ORDER BY from_id")
      .all() as Array<{ from_id: string }>;
    expect(rows).toEqual([{ from_id: "block-b" }]);
  });

  test("batchInsertLinks skips empty batches", () => {
    linksModule.batchInsertLinks([], db);

    const rows = db.query("SELECT * FROM links").all();
    expect(rows).toEqual([]);
  });

  test("batchInsertLinks replaces each link in a transaction", () => {
    const inserted: [string, string][] = [];
    const fakeDb = {
      prepare() {
        return {
          run(fromId: string, toId: string) {
            inserted.push([fromId, toId]);
          },
        };
      },
      transaction(callback: (links: [string, string][]) => void) {
        return (links: [string, string][]) => callback(links);
      },
    };

    linksModule.batchInsertLinks(
      [
        ["block-a", "page-a"],
        ["block-b", "page-b"],
      ],
      fakeDb as never,
    );

    expect(inserted).toEqual([
      ["block-a", "page-a"],
      ["block-b", "page-b"],
    ]);
  });
});

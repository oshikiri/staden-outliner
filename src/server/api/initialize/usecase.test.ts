import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  mock,
  test,
} from "bun:test";
import { Database as BunDatabase } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createPageFileRecord } from "@/shared/file";
import * as StadenRoot from "@/server/lib/env/stadenRoot";

const runMock = jest.fn();

mock.module("@/server/lib/importer/bulk_importer", () => ({
  BulkImporter: jest.fn().mockImplementation(() => ({
    run: runMock,
  })),
}));

import * as sqlite from "@/server/lib/sqlite";
import { initializeDatabase } from "./usecase";

describe("api/initialize/usecase", () => {
  let rootDir: string;

  beforeEach(() => {
    jest.clearAllMocks();
    rootDir = mkdtempSync(join(tmpdir(), "outliner-initialize-"));
    jest.spyOn(StadenRoot, "getStadenRoot").mockReturnValue(rootDir);
  });

  afterEach(async () => {
    sqlite.__resetDbForTests();
    await sqlite.close();
    rmSync(rootDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  test("initializeDatabase rebuilds the vault from the importer result", async () => {
    runMock.mockResolvedValue({
      blocks: [],
      pageIdByBlockId: new Map(),
      files: [createPageFileRecord("New Page", "page-new")],
      links: [],
    });

    const seedDb = new BunDatabase(`${rootDir}/vault.sqlite3`);
    seedDb.exec(`
      CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        title TEXT,
        path TEXT
      );
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
      CREATE TABLE IF NOT EXISTS links (
        from_id TEXT,
        to_id TEXT
      );
    `);
    seedDb.exec(
      "INSERT INTO pages (id, title, path) VALUES ('page-old', 'Old Page', NULL)",
    );
    seedDb.exec(
      "INSERT INTO blocks (id, page_id, parent_id, depth, order_index, content, content_markdown, properties) VALUES ('block-old', 'page-old', NULL, 0, 0, '[]', '', '[]')",
    );
    seedDb.exec(
      "INSERT INTO links (from_id, to_id) VALUES ('block-old', 'block-old')",
    );
    seedDb.close();

    sqlite.__resetDbForTests();

    await initializeDatabase();

    const reopened = new BunDatabase(`${rootDir}/vault.sqlite3`);
    const pages = reopened
      .query("SELECT id, title, path FROM pages ORDER BY id")
      .all() as Array<{ id: string; title: string; path: string | null }>;
    const blocks = reopened
      .query("SELECT id FROM blocks ORDER BY id")
      .all() as Array<{
      id: string;
    }>;
    const links = reopened
      .query("SELECT from_id, to_id FROM links ORDER BY from_id, to_id")
      .all() as Array<{ from_id: string; to_id: string }>;
    reopened.close();

    expect(pages).toEqual([{ id: "page-new", title: "New Page", path: null }]);
    expect(blocks).toEqual([]);
    expect(links).toEqual([]);
    expect(runMock).toHaveBeenCalledTimes(1);
  });
});

afterAll(() => {
  mock.restore();
});

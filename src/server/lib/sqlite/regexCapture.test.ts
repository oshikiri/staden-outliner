import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";
import { Database as BunDatabase } from "bun:sqlite";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import * as StadenRoot from "../env/stadenRoot";
import { getRegexCaptureExtensionOutputPath } from "./extensionPath";
import * as SqliteDb from "./db";

describe.serial("sqlite regex_capture extension", () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "outliner-regex-capture-"));
    jest.spyOn(StadenRoot, "getStadenRoot").mockReturnValue(rootDir);
    ensureRegexCaptureExtensionBuilt();
  });

  afterEach(async () => {
    SqliteDb.__resetDbForTests();
    await SqliteDb.close();
    rmSync(rootDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  test("returns capture groups as a JSON array string", () => {
    const seedDb = new BunDatabase(`${rootDir}/vault.sqlite3`);
    seedDb.exec(`
      CREATE TABLE pages (
        id TEXT PRIMARY KEY,
        title TEXT,
        path TEXT
      );
      CREATE TABLE blocks (
        id TEXT PRIMARY KEY,
        page_id TEXT,
        parent_id TEXT,
        depth INTEGER,
        order_index INTEGER DEFAULT 0,
        content TEXT,
        content_markdown TEXT,
        properties TEXT
      );
      CREATE TABLE links (
        from_id TEXT,
        to_id TEXT
      );
      CREATE VIEW blocks_p AS
      SELECT
        blocks.*, pages.title AS page_title, pages.path AS page_path
      FROM blocks
      JOIN pages ON blocks.page_id = pages.id;
    `);
    seedDb.exec(
      "INSERT INTO pages (id, title, path) VALUES ('page-from', 'From', NULL)",
    );
    seedDb.exec(
      "INSERT INTO pages (id, title, path) VALUES ('page-to', 'Staden Versions', NULL)",
    );
    seedDb.exec(
      "INSERT INTO blocks (id, page_id, parent_id, depth, content, content_markdown, properties) VALUES ('block-from', 'page-from', NULL, 0, '[]', 'v1.2.3:hello', '[]')",
    );
    seedDb.exec(
      "INSERT INTO blocks (id, page_id, parent_id, depth, content, content_markdown, properties) VALUES ('block-to', 'page-to', NULL, 0, '[]', '[]', '[]')",
    );
    seedDb.exec(
      "INSERT INTO links (from_id, to_id) VALUES ('block-from', 'block-to')",
    );
    seedDb.close();

    SqliteDb.ensureRegexCaptureExtensionLoaded(SqliteDb.getReadonlyDb());
    const rows = SqliteDb.getReadonlyDb()
      .query<
        { major: string; minor: string; patch: string; description: string },
        []
      >(
        `
          with versions as (
              select
                  regex_capture(p_from.content_markdown, 'v(\\d)\\.(\\d)\\.(\\d):(.+)') as cap
              from links
              join blocks_p p_from on p_from.id = links.from_id
              join blocks_p p_to on p_to.id = links.to_id
              where p_to.page_title = 'Staden Versions'
          )
          select
              cap ->> '$[0]' as major,
              cap ->> '$[1]' as minor,
              cap ->> '$[2]' as patch,
              cap ->> '$[3]' as description
          from versions
          where
              cap ->> '$[3]' is not null
        `,
      )
      .all();

    expect(rows).toEqual([
      {
        major: "1",
        minor: "2",
        patch: "3",
        description: "hello",
      },
    ]);
  });
});

function ensureRegexCaptureExtensionBuilt(): void {
  const outputPath = getRegexCaptureExtensionOutputPath();
  if (existsSync(outputPath)) {
    return;
  }

  const result = Bun.spawnSync(["bun", "run", "build:sqlite-extension"], {
    stdout: "inherit",
    stderr: "inherit",
  });
  if (result.exitCode !== 0) {
    throw new Error(
      `Failed to build SQLite regex_capture extension for tests: ${result.exitCode}`,
    );
  }
}

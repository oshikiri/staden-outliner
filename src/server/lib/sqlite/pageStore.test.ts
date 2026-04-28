import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  mock,
  test,
} from "bun:test";
import { Database as BunDatabase } from "bun:sqlite";

const queryAllMock = jest.fn();
const queryMock = jest.fn(() => ({
  all: queryAllMock,
}));
const logSqliteQueryMock = jest.fn();

mock.module("./db", () => ({
  getDb: jest.fn(() => ({
    query: queryMock,
  })),
  logSqliteQuery: logSqliteQueryMock,
}));

import { getPagesByTitles, initializePages } from "./pageStore";

let db: BunDatabase;

describe("sqlite/pageStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getPagesByTitles returns empty array without querying when titles are empty", () => {
    expect(getPagesByTitles([])).toEqual([]);
    expect(queryMock).not.toHaveBeenCalled();
  });

  test("getPagesByTitles builds placeholders for each title", () => {
    queryAllMock.mockReturnValue([
      {
        id: "page-1",
        title: "Page",
        path: "/tmp/Page.md",
      },
    ]);

    expect(getPagesByTitles(["Page", "Other"])).toEqual([
      {
        pageId: "page-1",
        title: "Page",
        path: "/tmp/Page.md",
      },
    ]);

    expect(queryMock).toHaveBeenCalledWith(
      "SELECT * FROM pages WHERE title IN (?, ?);",
    );
    expect(queryAllMock).toHaveBeenCalledWith("Page", "Other");
    expect(logSqliteQueryMock).toHaveBeenCalledWith(
      "SELECT * FROM pages WHERE title IN (?, ?);",
      ["Page", "Other"],
    );
  });
});

describe("pageStore", () => {
  beforeEach(() => {
    db = new BunDatabase(":memory:");
    db.exec(`
      CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        title TEXT,
        path TEXT
      );
    `);
  });

  afterEach(() => {
    db.close();
  });

  test("initializePages keeps existing rows", () => {
    db.exec(
      "INSERT INTO pages (id, title, path) VALUES ('page-a', 'Page A', NULL)",
    );

    initializePages(db);

    const rows = db
      .query("SELECT id, title, path FROM pages ORDER BY id")
      .all() as Array<{ id: string; title: string; path: string | null }>;
    expect(rows).toEqual([{ id: "page-a", title: "Page A", path: null }]);
  });

  test("initializePages creates an index for title lookups", () => {
    initializePages(db);

    const indexes = db
      .query(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'pages' ORDER BY name",
      )
      .all() as Array<{ name: string }>;
    expect(indexes.map((index) => index.name)).toContain("idx_pages_title");
  });
});

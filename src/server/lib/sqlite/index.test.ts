import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";
import { Database as BunDatabase } from "bun:sqlite";
import { mkdirSync } from "node:fs";

import * as StadenRoot from "../env/stadenRoot";
import * as Links from "./links";
import * as Blocks from "./blocks";
import * as Pages from "./pageStore";
import * as sqlite from "./index";
import * as SqliteDb from "./db";

let schemaVersion = 0;

const prepareMock = jest.fn(() => ({
  all: jest.fn(),
}));
const queryGetMock = jest.fn(() => ({ user_version: schemaVersion }));
const queryMock = jest.fn(() => ({
  get: queryGetMock,
}));
const execMock = jest.fn((sql: string) => {
  const match = sql.match(/PRAGMA user_version = (\d+);?/);
  if (match) {
    schemaVersion = Number(match[1]);
  }
});
const closeMock = jest.fn();
function databaseConstructorMock() {
  return {
    prepare: prepareMock,
    query: queryMock,
    exec: execMock,
    close: closeMock,
  };
}

describe.serial("sqlite lifecycle", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    SqliteDb.__resetDbForTests();
    SqliteDb.__setDatabaseConstructorForTests(
      databaseConstructorMock as unknown as typeof BunDatabase,
    );
    schemaVersion = 0;
    jest.spyOn(StadenRoot, "getStadenRoot").mockReturnValue("/tmp/staden");
  });

  afterEach(async () => {
    SqliteDb.__resetDbForTests();
    SqliteDb.__setDatabaseConstructorForTests(undefined);
    await SqliteDb.close();
    jest.restoreAllMocks();
  });

  test.skip("getDb reuses a single connection", async () => {
    SqliteDb.__resetDbForTests();
    await SqliteDb.close();
    mkdirSync("/tmp/staden", { recursive: true });
    SqliteDb.__setDatabaseConstructorForTests(undefined);
    const execSpy = jest
      .spyOn(BunDatabase.prototype, "exec")
      .mockImplementation(() => undefined as never);
    const first = SqliteDb.getDb();
    const second = SqliteDb.getDb();

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(execSpy).toHaveBeenCalledTimes(2);
    expect(execSpy).toHaveBeenCalledWith("PRAGMA foreign_keys = ON;");
    expect(execSpy).toHaveBeenCalledWith("PRAGMA journal_mode = WAL;");
    await SqliteDb.close();
  });

  test("initializeAllTables runs inside a transaction", async () => {
    const initializeLinksSpy = jest.spyOn(Links, "initializeLinks");
    const initializeBlocksSpy = jest.spyOn(Blocks, "initializeBlocks");
    const initializePagesSpy = jest.spyOn(Pages, "initializePages");

    const database = databaseConstructorMock() as never;
    execMock.mockClear();
    queryMock.mockClear();

    sqlite.initializeAllTables(database);

    expect(initializeLinksSpy).toHaveBeenCalledWith(database);
    expect(initializeBlocksSpy).toHaveBeenCalledWith(database);
    expect(initializePagesSpy).toHaveBeenCalledWith(database);
    expect(execMock.mock.calls[0]?.[0]).toBe("BEGIN;");
    expect(
      execMock.mock.calls.some(([sql]) =>
        String(sql).includes("PRAGMA user_version = 1;"),
      ),
    ).toBe(true);
    expect(
      execMock.mock.calls.some(([sql]) =>
        String(sql).includes("DROP VIEW IF EXISTS blocks_p;"),
      ),
    ).toBe(true);
    expect(execMock.mock.calls.at(-1)?.[0]).toBe("COMMIT;");
    expect(queryMock).toHaveBeenCalledWith("PRAGMA user_version;");
    expect(
      execMock.mock.calls.some(([sql]) => String(sql).includes("DROP TABLE")),
    ).toBe(false);
  });

  test("initializeAllTables stops when a step fails", async () => {
    const initializeLinksSpy = jest.spyOn(Links, "initializeLinks");
    const initializeBlocksSpy = jest
      .spyOn(Blocks, "initializeBlocks")
      .mockImplementation(() => {
        throw new Error("boom");
      });
    const initializePagesSpy = jest.spyOn(Pages, "initializePages");

    const database = databaseConstructorMock() as never;
    execMock.mockClear();
    queryMock.mockClear();

    expect(() => sqlite.initializeAllTables(database)).toThrow("boom");
    expect(initializeLinksSpy).toHaveBeenCalledTimes(1);
    expect(initializeBlocksSpy).toHaveBeenCalledTimes(1);
    expect(initializePagesSpy).not.toHaveBeenCalled();
    expect(execMock.mock.calls[0]?.[0]).toBe("BEGIN;");
    expect(execMock.mock.calls.at(-1)?.[0]).toBe("ROLLBACK;");
  });

  test("initializeAllTables does not rewrite the schema version when it is current", async () => {
    schemaVersion = 1;

    const database = databaseConstructorMock() as never;
    execMock.mockClear();
    queryMock.mockClear();

    sqlite.initializeAllTables(database);

    expect(queryMock).toHaveBeenCalledWith("PRAGMA user_version;");
    expect(
      execMock.mock.calls.some(([sql]) =>
        String(sql).includes("PRAGMA user_version = 1"),
      ),
    ).toBe(false);
  });

  test("initializeAllTables refuses unsupported schema versions", async () => {
    const database = databaseConstructorMock() as never;
    execMock.mockClear();
    queryMock.mockClear();
    schemaVersion = 2;

    expect(() => sqlite.initializeAllTables(database)).toThrow(
      "Unsupported sqlite schema version: 2 > 1",
    );
    expect(
      execMock.mock.calls.some(([sql]) =>
        String(sql).includes("PRAGMA user_version = 1"),
      ),
    ).toBe(false);
  });

  test("initializeAllTables works without a transaction helper", async () => {
    const database = {
      query: queryMock,
      exec: execMock,
    };

    execMock.mockClear();
    queryMock.mockClear();

    sqlite.initializeAllTables(database as never);

    expect(queryMock).toHaveBeenCalledWith("PRAGMA user_version;");
    expect(execMock.mock.calls.map(([sql]) => String(sql))).toContain("BEGIN;");
    expect(execMock.mock.calls.map(([sql]) => String(sql))).toContain(
      "COMMIT;",
    );
  });
});

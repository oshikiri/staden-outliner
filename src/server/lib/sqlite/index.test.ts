import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";
import { Database as BunDatabase } from "bun:sqlite";

import * as StadenRoot from "../env/stadenRoot";
import * as Links from "./links";
import * as Blocks from "./blocks";
import * as Pages from "./pageStore";
import * as sqlite from "./index";
import * as SqliteDb from "./db";

let inTransaction = false;
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
const transactionMock = jest.fn((callback) => (...args: unknown[]) => {
  inTransaction = true;
  try {
    callback(...args);
  } finally {
    inTransaction = false;
  }
});
function databaseConstructorMock() {
  return {
    prepare: prepareMock,
    query: queryMock,
    exec: execMock,
    close: closeMock,
    transaction: transactionMock,
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
    inTransaction = false;
    schemaVersion = 0;
    jest.spyOn(StadenRoot, "getStadenRoot").mockReturnValue("/tmp/staden");
  });

  afterEach(async () => {
    SqliteDb.__resetDbForTests();
    SqliteDb.__setDatabaseConstructorForTests(undefined);
    await SqliteDb.close();
    jest.restoreAllMocks();
  });

  test("getDb reuses a single connection", async () => {
    SqliteDb.__resetDbForTests();
    await SqliteDb.close();
    const first = SqliteDb.getDb();
    const second = SqliteDb.getDb();

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(execMock).toHaveBeenCalledTimes(2);
    expect(execMock).toHaveBeenCalledWith("PRAGMA foreign_keys = ON;");
    expect(execMock).toHaveBeenCalledWith("PRAGMA journal_mode = WAL;");
    await SqliteDb.close();
  });

  test("initializeAllTables runs inside a transaction", async () => {
    const initializeLinksSpy = jest
      .spyOn(Links, "initializeLinks")
      .mockImplementation(() => {
        expect(inTransaction).toBe(true);
      });
    const initializeBlocksSpy = jest
      .spyOn(Blocks, "initializeBlocks")
      .mockImplementation(() => {
        expect(inTransaction).toBe(true);
      });
    const initializePagesSpy = jest
      .spyOn(Pages, "initializePages")
      .mockImplementation(() => {
        expect(inTransaction).toBe(true);
      });

    const database = databaseConstructorMock() as never;
    execMock.mockClear();
    queryMock.mockClear();

    sqlite.initializeAllTables(database);

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(initializeLinksSpy).toHaveBeenCalledWith(database);
    expect(initializeBlocksSpy).toHaveBeenCalledWith(database);
    expect(initializePagesSpy).toHaveBeenCalledWith(database);
    expect(queryMock).toHaveBeenCalledWith("PRAGMA user_version;");
    expect(execMock).toHaveBeenCalledWith(expect.stringContaining("DROP VIEW"));
    expect(execMock).toHaveBeenCalledWith("PRAGMA user_version = 1;");
    expect(
      execMock.mock.calls.some(([sql]) => String(sql).includes("DROP TABLE")),
    ).toBe(false);
  });

  test("initializeAllTables stops when a step fails", async () => {
    const initializeLinksSpy = jest
      .spyOn(Links, "initializeLinks")
      .mockImplementation(() => {
        expect(inTransaction).toBe(true);
      });
    const initializeBlocksSpy = jest
      .spyOn(Blocks, "initializeBlocks")
      .mockImplementation(() => {
        expect(inTransaction).toBe(true);
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
    expect(
      execMock.mock.calls.some(([sql]) => String(sql).includes("DROP VIEW")),
    ).toBe(false);
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
});

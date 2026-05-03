import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";
import { Database as BunDatabase } from "bun:sqlite";

import * as StadenRoot from "../env/stadenRoot";
import * as Links from "./links";
import * as Blocks from "./blocks";
import * as Pages from "./pageStore";
import * as sqlite from "./index";

let inTransaction = false;
let schemaVersion = 0;
let databaseConstructorCallCount = 0;

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
  databaseConstructorCallCount += 1;
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
    sqlite.__resetDbForTests();
    sqlite.__setDatabaseConstructorForTests(
      databaseConstructorMock as unknown as typeof BunDatabase,
    );
    inTransaction = false;
    schemaVersion = 0;
    databaseConstructorCallCount = 0;
    jest.spyOn(StadenRoot, "getStadenRoot").mockReturnValue("/tmp/staden");
  });

  afterEach(async () => {
    sqlite.__resetDbForTests();
    sqlite.__setDatabaseConstructorForTests(undefined);
    await sqlite.close();
    jest.restoreAllMocks();
  });

  test("getDb reuses a single connection", async () => {
    sqlite.__resetDbForTests();
    await sqlite.close();
    const first = sqlite.getDb();
    const second = sqlite.getDb();

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(databaseConstructorCallCount).toBe(1);
    expect(execMock).toHaveBeenCalledWith("PRAGMA foreign_keys = ON;");
    expect(execMock).toHaveBeenCalledWith("PRAGMA journal_mode = WAL;");
    await sqlite.close();
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

    sqlite.__resetDbForTests();
    await sqlite.close();
    sqlite.getDb();
    execMock.mockClear();
    queryMock.mockClear();

    sqlite.initializeAllTables();

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(initializeLinksSpy).toHaveBeenCalledTimes(1);
    expect(initializeBlocksSpy).toHaveBeenCalledTimes(1);
    expect(initializePagesSpy).toHaveBeenCalledTimes(1);
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

    sqlite.__resetDbForTests();
    await sqlite.close();
    sqlite.getDb();
    execMock.mockClear();
    queryMock.mockClear();

    expect(() => sqlite.initializeAllTables()).toThrow("boom");
    expect(initializeLinksSpy).toHaveBeenCalledTimes(1);
    expect(initializeBlocksSpy).toHaveBeenCalledTimes(1);
    expect(initializePagesSpy).not.toHaveBeenCalled();
    expect(
      execMock.mock.calls.some(([sql]) => String(sql).includes("DROP VIEW")),
    ).toBe(false);
  });

  test("initializeAllTables does not rewrite the schema version when it is current", async () => {
    schemaVersion = 1;

    sqlite.__resetDbForTests();
    await sqlite.close();
    sqlite.getDb();
    execMock.mockClear();
    queryMock.mockClear();

    sqlite.initializeAllTables();

    expect(queryMock).toHaveBeenCalledWith("PRAGMA user_version;");
    expect(
      execMock.mock.calls.some(([sql]) =>
        String(sql).includes("PRAGMA user_version = 1"),
      ),
    ).toBe(false);
  });

  test("initializeAllTables refuses unsupported schema versions", async () => {
    sqlite.__resetDbForTests();
    await sqlite.close();
    sqlite.getDb();
    execMock.mockClear();
    queryMock.mockClear();
    schemaVersion = 2;

    expect(() => sqlite.initializeAllTables()).toThrow(
      "Unsupported sqlite schema version: 2 > 1",
    );
    expect(
      execMock.mock.calls.some(([sql]) =>
        String(sql).includes("PRAGMA user_version = 1"),
      ),
    ).toBe(false);
  });
});

import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";
import { Database as BunDatabase } from "bun:sqlite";

import * as StadenRoot from "../env/stadenRoot";
import * as Links from "./links";
import * as Blocks from "./blocks";
import * as Pages from "./pageStore";

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
const databaseConstructorMock = jest.fn(() => ({
  prepare: prepareMock,
  query: queryMock,
  exec: execMock,
  close: closeMock,
  transaction: transactionMock,
}));

let importCounter = 0;

async function loadSqliteModule() {
  const module = await import(`./index.ts?test=${importCounter++}`);
  module.__setDatabaseConstructorForTests(
    databaseConstructorMock as unknown as typeof BunDatabase,
  );
  return module;
}

describe.serial("sqlite lifecycle", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    inTransaction = false;
    schemaVersion = 0;
    jest.spyOn(StadenRoot, "getStadenRoot").mockReturnValue("/tmp/staden");
  });

  afterEach(async () => {
    const sqlite = await loadSqliteModule();
    sqlite.__resetDbForTests();
    sqlite.__setDatabaseConstructorForTests(undefined);
    await sqlite.close();
  });

  test("getDb reuses a single connection", async () => {
    const sqlite = await loadSqliteModule();
    sqlite.__resetDbForTests();
    await sqlite.close();
    const first = sqlite.getDb();
    const second = sqlite.getDb();

    expect(first).toBe(second);
    expect(databaseConstructorMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledWith("PRAGMA foreign_keys = ON;");
    expect(execMock).toHaveBeenCalledWith("PRAGMA journal_mode = WAL;");
    await sqlite.close();
  });

  test("open reuses the existing connection", async () => {
    const sqlite = await loadSqliteModule();
    sqlite.__resetDbForTests();
    await sqlite.close();
    const first = await sqlite.open();
    const second = await sqlite.open();

    expect(first).toBe(second);
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

    const sqlite = await loadSqliteModule();
    sqlite.__resetDbForTests();
    await sqlite.close();
    await sqlite.open();
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

    const sqlite = await loadSqliteModule();
    sqlite.__resetDbForTests();
    await sqlite.close();
    await sqlite.open();
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

    const sqlite = await loadSqliteModule();
    sqlite.__resetDbForTests();
    await sqlite.close();
    await sqlite.open();
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
    const sqlite = await loadSqliteModule();
    sqlite.__resetDbForTests();
    await sqlite.close();
    await sqlite.open();
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

import { beforeEach, describe, expect, jest, test } from "bun:test";
import { Database as BunDatabase } from "bun:sqlite";

import * as StadenRoot from "../env/stadenRoot";
import * as Links from "./links";
import * as Blocks from "./blocks";
import * as Pages from "./pageStore";

let inTransaction = false;

const prepareMock = jest.fn(() => ({
  all: jest.fn(),
}));
const execMock = jest.fn();
const closeMock = jest.fn();
const transactionMock = jest.fn((callback) => () => {
  inTransaction = true;
  try {
    callback();
  } finally {
    inTransaction = false;
  }
});
const databaseConstructorMock = jest.fn(() => ({
  prepare: prepareMock,
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
    jest.spyOn(StadenRoot, "getStadenRoot").mockReturnValue("/tmp/staden");
  });

  test("getDb reuses a single connection", async () => {
    const sqlite = await loadSqliteModule();
    sqlite.__resetDbForTests();
    await sqlite.close();
    const first = sqlite.getDb();
    const second = sqlite.getDb();

    expect(first).toBe(second);
    expect(databaseConstructorMock).toHaveBeenCalledTimes(1);
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

    sqlite.initializeAllTables();

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(initializeLinksSpy).toHaveBeenCalledTimes(1);
    expect(initializeBlocksSpy).toHaveBeenCalledTimes(1);
    expect(initializePagesSpy).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledWith(expect.stringContaining("DROP VIEW"));
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

    expect(() => sqlite.initializeAllTables()).toThrow("boom");
    expect(initializeLinksSpy).toHaveBeenCalledTimes(1);
    expect(initializeBlocksSpy).toHaveBeenCalledTimes(1);
    expect(initializePagesSpy).not.toHaveBeenCalled();
    expect(execMock).not.toHaveBeenCalled();
  });
});

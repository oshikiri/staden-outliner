import { beforeEach, describe, expect, jest, mock, test } from "bun:test";
import { Database as BunDatabase } from "bun:sqlite";

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
const initializeLinksMock = jest.fn(() => {
  expect(inTransaction).toBe(true);
});
const initializeBlocksMock = jest.fn(() => {
  expect(inTransaction).toBe(true);
});
const initializePagesMock = jest.fn(() => {
  expect(inTransaction).toBe(true);
});
const databaseConstructorMock = jest.fn(() => ({
  prepare: prepareMock,
  exec: execMock,
  close: closeMock,
  transaction: transactionMock,
}));
const getStadenRootMock = jest.fn(() => "/tmp/staden");

mock.module("../env/stadenRoot", () => ({
  getStadenRoot: getStadenRootMock,
}));
mock.module("./links", () => ({
  initializeLinks: initializeLinksMock,
}));
mock.module("./blocks", () => ({
  initializeBlocks: initializeBlocksMock,
}));
mock.module("./pageStore", () => ({
  initializePages: initializePagesMock,
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
  beforeEach(async () => {
    jest.clearAllMocks();
    inTransaction = false;
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
    const sqlite = await loadSqliteModule();
    sqlite.__resetDbForTests();
    await sqlite.close();

    sqlite.initializeAllTables();

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(initializeLinksMock).toHaveBeenCalledTimes(1);
    expect(initializeBlocksMock).toHaveBeenCalledTimes(1);
    expect(initializePagesMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledWith(expect.stringContaining("DROP VIEW"));
  });

  test("initializeAllTables stops when a step fails", async () => {
    const sqlite = await loadSqliteModule();
    sqlite.__resetDbForTests();
    await sqlite.close();

    initializeBlocksMock.mockImplementation(() => {
      expect(inTransaction).toBe(true);
      throw new Error("boom");
    });

    expect(() => sqlite.initializeAllTables()).toThrow("boom");
    expect(initializeLinksMock).toHaveBeenCalledTimes(1);
    expect(initializeBlocksMock).toHaveBeenCalledTimes(1);
    expect(initializePagesMock).not.toHaveBeenCalled();
    expect(execMock).not.toHaveBeenCalled();
  });
});

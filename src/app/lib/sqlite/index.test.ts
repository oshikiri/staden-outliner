import { beforeEach, describe, expect, jest, test } from "bun:test";

const prepareMock = jest.fn(() => ({
  all: jest.fn(),
}));
const execMock = jest.fn();
const closeMock = jest.fn();
const databaseConstructorMock = jest.fn(() => ({
  prepare: prepareMock,
  exec: execMock,
  close: closeMock,
  transaction: jest.fn((callback) => callback),
}));
const getStadenRootMock = jest.fn(() => "/tmp/staden");

jest.mock("../env/stadenRoot", () => ({
  getStadenRoot: getStadenRootMock,
}));

let importCounter = 0;

async function loadSqliteModule() {
  const module = await import(`./index.ts?test=${importCounter++}`);
  module.__setDatabaseConstructorForTests(databaseConstructorMock);
  return module;
}

describe.serial("sqlite lifecycle", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
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
});

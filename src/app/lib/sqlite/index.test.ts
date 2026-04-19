import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";

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

import {
  __resetDbForTests,
  __setDatabaseConstructorForTests,
  close,
  getDb,
  open,
} from "./index";

describe.serial("sqlite lifecycle", () => {
  beforeEach(async () => {
    __resetDbForTests();
    await close();
    jest.clearAllMocks();
    __setDatabaseConstructorForTests(databaseConstructorMock);
  });

  afterEach(async () => {
    __setDatabaseConstructorForTests(undefined);
    await close();
    __resetDbForTests();
  });

  test("getDb reuses a single connection", async () => {
    await close();
    const first = getDb();
    const second = getDb();

    expect(first).toBe(second);
    expect(databaseConstructorMock).toHaveBeenCalledTimes(1);
  });

  test("open reuses the existing connection", async () => {
    await close();
    const first = await open();
    const second = await open();

    expect(first).toBe(second);
  });
});

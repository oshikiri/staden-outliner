import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";

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

import { __setDatabaseConstructorForTests, close, getDb, open } from "./index";

describe("sqlite lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __setDatabaseConstructorForTests(databaseConstructorMock);
  });

  afterEach(async () => {
    __setDatabaseConstructorForTests(undefined);
    await close();
  });

  test("getDb reuses a single connection", () => {
    const first = getDb();
    const second = getDb();

    expect(first).toBe(second);
    expect(databaseConstructorMock).toHaveBeenCalledTimes(1);
  });

  test("open reuses the existing connection", async () => {
    const first = await open();
    const second = await open();

    expect(first).toBe(second);
    expect(databaseConstructorMock).toHaveBeenCalledTimes(1);
  });

  test("close resets the connection so the next access reopens it", async () => {
    const first = getDb();

    await close();

    const second = getDb();

    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(first).not.toBe(second);
    expect(databaseConstructorMock).toHaveBeenCalledTimes(2);
  });
});

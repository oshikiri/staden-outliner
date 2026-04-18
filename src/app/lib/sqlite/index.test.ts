import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";

const functionMock = jest.fn();
const prepareMock = jest.fn(() => ({
  all: jest.fn(),
}));
const execMock = jest.fn();
const closeMock = jest.fn();
const databaseConstructorMock = jest.fn(() => ({
  function: functionMock,
  prepare: prepareMock,
  exec: execMock,
  close: closeMock,
}));
const getStadenRootMock = jest.fn(() => "/tmp/staden");

jest.mock("better-sqlite3", () => ({
  __esModule: true,
  default: databaseConstructorMock,
}));

jest.mock("../env/stadenRoot", () => ({
  getStadenRoot: getStadenRootMock,
}));

import { close, getDb, open } from "./index";

describe("sqlite lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await close();
  });

  test("getDb reuses a single connection and registers functions once", () => {
    const first = getDb();
    const second = getDb();

    expect(first).toBe(second);
    expect(databaseConstructorMock).toHaveBeenCalledTimes(1);
    expect(functionMock).toHaveBeenCalledTimes(1);
    expect(functionMock).toHaveBeenCalledWith(
      "regex_capture",
      expect.any(Function),
    );
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
    expect(functionMock).toHaveBeenCalledTimes(2);
  });
});

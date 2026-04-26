import { beforeEach, describe, expect, jest, mock, test } from "bun:test";

const initializeAllTablesMock = jest.fn();
const batchInsertBlocksMock = jest.fn();
const batchInsertFilesMock = jest.fn();
const batchInsertLinksMock = jest.fn();
const openMock = jest.fn();
const closeMock = jest.fn();
const runMock = jest.fn();

mock.module("@/server/lib/sqlite", () => ({
  open: openMock,
  close: closeMock,
  initializeAllTables: initializeAllTablesMock,
  batchInsertBlocks: batchInsertBlocksMock,
  batchInsertFiles: batchInsertFilesMock,
  batchInsertLinks: batchInsertLinksMock,
}));

mock.module("@/server/lib/importer/bulk_importer", () => ({
  BulkImporter: jest.fn().mockImplementation(() => ({
    run: runMock,
  })),
}));

import { honoApiApp } from "@/server/api/app";

describe("api/initialize/route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    runMock.mockResolvedValue({
      blocks: [],
      pageIdByBlockId: new Map(),
      files: [],
      links: [],
    });
  });
  test("POST initializes the database", async () => {
    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/initialize", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(204);
    expect(openMock).toHaveBeenCalled();
    expect(initializeAllTablesMock).toHaveBeenCalled();
    expect(runMock).toHaveBeenCalled();
    expect(batchInsertBlocksMock).toHaveBeenCalledWith([], 1000, {
      pageIdByBlockId: new Map(),
    });
    expect(batchInsertFilesMock).toHaveBeenCalledWith([], 1000);
    expect(batchInsertLinksMock).toHaveBeenCalledWith([]);
    expect(closeMock).toHaveBeenCalled();
  });

  test("POST closes the database when importer fails", async () => {
    runMock.mockRejectedValue(new Error("import failed"));

    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/initialize", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({
      message: "Internal Server Error",
    });
    expect(openMock).toHaveBeenCalled();
    expect(closeMock).toHaveBeenCalled();
  });
});

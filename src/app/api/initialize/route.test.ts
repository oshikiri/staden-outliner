import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const initializeAllTablesMock = jest.fn();
const batchInsertBlocksMock = jest.fn();
const batchInsertFilesMock = jest.fn();
const batchInsertLinksMock = jest.fn();
const openMock = jest.fn();
const closeMock = jest.fn();
const runMock = jest.fn();

jest.mock("../../lib/sqlite", () => ({
  open: openMock,
  close: closeMock,
  initializeAllTables: initializeAllTablesMock,
  batchInsertBlocks: batchInsertBlocksMock,
  batchInsertFiles: batchInsertFilesMock,
  batchInsertLinks: batchInsertLinksMock,
}));

jest.mock("../../lib/importer/bulk_importer", () => ({
  BulkImporter: jest.fn().mockImplementation(() => ({
    run: runMock,
  })),
}));

import { POST } from "@/app/api/hono/apiRoute";

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
    const response = await POST(
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

    const response = await POST(
      new Request("http://localhost/api/initialize", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toBe("Internal Server Error");
    expect(openMock).toHaveBeenCalled();
    expect(closeMock).toHaveBeenCalled();
  });
});

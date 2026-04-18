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

import { POST } from "./route";

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
    const response = await POST();

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

    await expect(POST()).rejects.toThrow("import failed");
    expect(openMock).toHaveBeenCalled();
    expect(closeMock).toHaveBeenCalled();
  });
});

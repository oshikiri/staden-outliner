import { beforeEach, describe, expect, jest, test } from "bun:test";

import { Block } from "@/shared/markdown/block";
import { PageRef } from "@/shared/markdown/token";
import type { PageFileRecord } from "@/shared/file";
import * as SqliteBlocks from "@/server/lib/sqlite/blocks";
import * as Links from "@/server/lib/sqlite/links";
import * as PageStore from "@/server/lib/sqlite/pageStore";

import {
  createNewFileWithEmptyBlock,
  importBlockRecursive,
} from "./incremental_importer";

const deleteLinksByFromIdMock = jest.fn();
const batchInsertLinksMock = jest.fn();
const getPagesByTitlesMock = jest.fn();
const putFileMock = jest.fn();
const batchInsertBlocksMock = jest.fn();

describe("incremental_importer", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest
      .spyOn(Links, "deleteLinksByFromId")
      .mockImplementation(deleteLinksByFromIdMock);
    jest
      .spyOn(Links, "batchInsertLinks")
      .mockImplementation(batchInsertLinksMock);
    jest
      .spyOn(PageStore, "getPagesByTitles")
      .mockImplementation(getPagesByTitlesMock);
    jest.spyOn(PageStore, "putFile").mockImplementation(putFileMock);
    jest
      .spyOn(SqliteBlocks, "batchInsertBlocks")
      .mockImplementation(batchInsertBlocksMock);
  });

  test("importBlockRecursive refreshes links and stores flattened blocks", () => {
    const child = new Block([], 1, []).withId("child-1");
    const block = new Block([new PageRef("Target")], 0, [child]).withId(
      "page-1",
    );
    child.withParent(block);

    getPagesByTitlesMock.mockReturnValue([
      { pageId: "page-target", title: "Target" } satisfies PageFileRecord,
    ]);

    const result = importBlockRecursive(block);

    expect(result).toBe(block);
    expect(deleteLinksByFromIdMock).toHaveBeenCalledWith("page-1");
    expect(getPagesByTitlesMock).toHaveBeenCalledWith(["Target"]);
    expect(batchInsertLinksMock).toHaveBeenCalledWith([
      ["page-1", "page-target"],
    ]);
    expect(batchInsertBlocksMock).toHaveBeenCalledWith([block, child], 1000, {
      defaultPageId: "page-1",
    });
  });

  test("createNewFileWithEmptyBlock creates a page and persists it", () => {
    const randomUuidSpy = jest
      .spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("11111111-1111-4111-8111-111111111111")
      .mockReturnValueOnce("22222222-2222-4222-8222-222222222222");

    const result = createNewFileWithEmptyBlock("Draft", undefined);

    expect(result.file).toEqual({
      title: "Draft",
      pageId: "11111111-1111-4111-8111-111111111111",
    });
    expect(result.block.id).toBe("11111111-1111-4111-8111-111111111111");
    expect(result.block.children).toHaveLength(1);
    expect(result.block.children[0].id).toBe(
      "22222222-2222-4222-8222-222222222222",
    );
    expect(result.block.children[0].parent).toBe(result.block);
    expect(putFileMock).toHaveBeenCalledWith(result.file);
    expect(batchInsertBlocksMock).toHaveBeenCalledWith(
      [result.block, result.block.children[0]],
      2,
      {
        defaultPageId: "11111111-1111-4111-8111-111111111111",
      },
    );
    expect(randomUuidSpy).toHaveBeenCalledTimes(2);
  });
});

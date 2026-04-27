import { beforeEach, describe, expect, jest, test } from "bun:test";

import * as FileStore from "@/shared/file";
import * as SqliteDb from "../sqlite/db";
import * as IncrementalImporter from "../importer/incremental_importer";
import { Block } from "@/shared/markdown/block";
import * as IncrementalExporter from "../exporter/incremental_exporter";
import * as PageBlocks from "../sqlite/blocks";
import * as PageStore from "../sqlite/pageStore";

import * as ContentResolver from "./contentResolver";
import { getPageByTitle, updatePageByTitle } from "./pageService";

let inTransaction = false;
const transactionMock = jest.fn((callback) => () => {
  inTransaction = true;
  try {
    callback();
  } finally {
    inTransaction = false;
  }
});
const queryAllMock = jest.fn(() => []);
const queryMock = jest.fn(() => ({
  all: queryAllMock,
}));
const prepareMock = jest.fn(() => ({
  run: jest.fn(),
}));
const execMock = jest.fn();

describe("pageService", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    inTransaction = false;
    queryAllMock.mockReturnValue([]);
    jest.spyOn(SqliteDb, "getDb").mockReturnValue({
      transaction: transactionMock,
      query: queryMock,
      prepare: prepareMock,
      exec: execMock,
    } as never);
  });

  test("getPageByTitle returns a draft page without persisting when the page does not exist", async () => {
    jest.spyOn(PageBlocks, "getPageBlockByTitle").mockResolvedValue(undefined);
    jest.spyOn(PageStore, "getPageByTitle").mockResolvedValue(undefined);
    const resolvePageContentSpy = jest
      .spyOn(ContentResolver, "resolvePageContent")
      .mockImplementation(async (page) => page);
    const createNewFileSpy = jest.spyOn(
      IncrementalImporter,
      "createNewFileWithEmptyBlock",
    );

    const page = await getPageByTitle("draft-page");

    expect(page.getProperty("title")).toBe("draft-page");
    expect(page.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(page.children).toHaveLength(1);
    expect(page.children[0].id).toBeDefined();
    expect(page.children[0].id).not.toBe(page.id);
    expect(page.children[0].parent).toBe(page);
    expect(page.children[0].parent?.id).toBe(page.id);
    expect(resolvePageContentSpy).toHaveBeenCalledWith(page);
    expect(createNewFileSpy).not.toHaveBeenCalled();
  });

  test("getPageByTitle preserves encoded titles at the service boundary", async () => {
    const getPageBlockByTitleSpy = jest
      .spyOn(PageBlocks, "getPageBlockByTitle")
      .mockResolvedValue(undefined);
    const getPageByTitleSpy = jest
      .spyOn(PageStore, "getPageByTitle")
      .mockResolvedValue(undefined);
    const resolvePageContentSpy = jest
      .spyOn(ContentResolver, "resolvePageContent")
      .mockImplementation(async (page) => page);

    const page = await getPageByTitle("draft%20page");

    expect(getPageBlockByTitleSpy).toHaveBeenCalledWith("draft%20page");
    expect(getPageByTitleSpy).toHaveBeenCalledWith("draft%20page");
    expect(resolvePageContentSpy).toHaveBeenCalledWith(page);
    expect(page.getProperty("title")).toBe("draft%20page");
  });

  test("updatePageByTitle creates a page record on the first save", async () => {
    const draftPage = new Block([], 0, [
      new Block([], 1, []).withId("child-1"),
    ]);
    draftPage.withId("page-1");
    draftPage.setProperty("title", "draft-page");

    jest.spyOn(PageBlocks, "getPageBlockByTitle").mockResolvedValue(undefined);
    jest.spyOn(PageStore, "getPageByTitle").mockResolvedValue(undefined);
    const createFileSpy = jest
      .spyOn(FileStore, "createPageFileRecord")
      .mockReturnValue({ title: "draft-page", pageId: "page-1" });
    const putFileSpy = jest
      .spyOn(PageStore, "putFile")
      .mockImplementation((file) => {
        expect(inTransaction).toBe(true);
        return file;
      });
    const importSpy = jest
      .spyOn(IncrementalImporter, "importBlockRecursive")
      .mockImplementation((page) => {
        expect(inTransaction).toBe(true);
        return page;
      });
    const exportSpy = jest
      .spyOn(IncrementalExporter, "exportOnePageToMarkdown")
      .mockImplementation(async () => {
        expect(inTransaction).toBe(false);
        return "draft-page";
      });
    const resolvePageContentSpy = jest
      .spyOn(ContentResolver, "resolvePageContent")
      .mockImplementation(async (page) => page);

    const savedPage = await updatePageByTitle("draft-page", draftPage);

    expect(createFileSpy).toHaveBeenCalledWith("draft-page", "page-1");
    expect(putFileSpy).toHaveBeenCalled();
    expect(importSpy).toHaveBeenCalledWith(savedPage);
    expect(exportSpy).toHaveBeenCalledWith("draft-page");
    expect(resolvePageContentSpy).toHaveBeenCalledWith(savedPage);
    expect(savedPage.id).toBe("page-1");
    expect(savedPage.children[0].parent).toBe(savedPage);
    expect(savedPage.getProperty("title")).toBe("draft-page");
  });

  test("updatePageByTitle preserves encoded titles at the service boundary", async () => {
    const draftPage = new Block([], 0, [
      new Block([], 1, []).withId("child-1"),
    ]);
    draftPage.withId("page-1");
    draftPage.setProperty("title", "draft%20page");

    jest.spyOn(PageBlocks, "getPageBlockByTitle").mockResolvedValue(undefined);
    jest.spyOn(PageStore, "getPageByTitle").mockResolvedValue(undefined);
    const createFileSpy = jest
      .spyOn(FileStore, "createPageFileRecord")
      .mockReturnValue({ title: "draft%20page", pageId: "page-1" });
    const putFileSpy = jest
      .spyOn(PageStore, "putFile")
      .mockImplementation((file) => {
        expect(inTransaction).toBe(true);
        return file;
      });
    const importSpy = jest
      .spyOn(IncrementalImporter, "importBlockRecursive")
      .mockImplementation((page) => {
        expect(inTransaction).toBe(true);
        return page;
      });
    const exportSpy = jest
      .spyOn(IncrementalExporter, "exportOnePageToMarkdown")
      .mockImplementation(async () => {
        expect(inTransaction).toBe(false);
        return "draft-page";
      });
    const resolvePageContentSpy = jest
      .spyOn(ContentResolver, "resolvePageContent")
      .mockImplementation(async (page) => page);

    const savedPage = await updatePageByTitle("draft%20page", draftPage);

    expect(createFileSpy).toHaveBeenCalledWith("draft%20page", "page-1");
    expect(putFileSpy).toHaveBeenCalled();
    expect(importSpy).toHaveBeenCalledWith(savedPage);
    expect(exportSpy).toHaveBeenCalledWith("draft%20page");
    expect(resolvePageContentSpy).toHaveBeenCalledWith(savedPage);
    expect(savedPage.getProperty("title")).toBe("draft%20page");
  });

  test("updatePageByTitle surfaces markdown export failures after saving", async () => {
    const draftPage = new Block([], 0, [
      new Block([], 1, []).withId("child-1"),
    ]);
    draftPage.withId("page-1");
    draftPage.setProperty("title", "draft-page");

    jest.spyOn(PageBlocks, "getPageBlockByTitle").mockResolvedValue(undefined);
    jest.spyOn(PageStore, "getPageByTitle").mockResolvedValue(undefined);
    jest
      .spyOn(FileStore, "createPageFileRecord")
      .mockReturnValue({ title: "draft-page", pageId: "page-1" });
    jest.spyOn(PageStore, "putFile").mockImplementation((file) => {
      expect(inTransaction).toBe(true);
      return file;
    });
    jest
      .spyOn(IncrementalImporter, "importBlockRecursive")
      .mockImplementation((page) => {
        expect(inTransaction).toBe(true);
        return page;
      });
    jest
      .spyOn(IncrementalExporter, "exportOnePageToMarkdown")
      .mockRejectedValue(new Error("export failed"));

    await expect(updatePageByTitle("draft-page", draftPage)).rejects.toThrow(
      "export failed",
    );
  });

  test("updatePageByTitle surfaces sqlite save failures before export", async () => {
    const draftPage = new Block([], 0, [
      new Block([], 1, []).withId("child-1"),
    ]);
    draftPage.withId("page-1");
    draftPage.setProperty("title", "draft-page");

    jest.spyOn(PageBlocks, "getPageBlockByTitle").mockResolvedValue(undefined);
    jest.spyOn(PageStore, "getPageByTitle").mockResolvedValue(undefined);
    jest.spyOn(FileStore, "createPageFileRecord").mockReturnValue({
      title: "draft-page",
      pageId: "page-1",
    });
    jest.spyOn(PageStore, "putFile").mockImplementation(() => {
      throw new Error("sqlite save failed");
    });
    const importSpy = jest.spyOn(IncrementalImporter, "importBlockRecursive");
    const exportSpy = jest.spyOn(
      IncrementalExporter,
      "exportOnePageToMarkdown",
    );

    await expect(updatePageByTitle("draft-page", draftPage)).rejects.toThrow(
      "sqlite save failed",
    );
    expect(importSpy).not.toHaveBeenCalled();
    expect(exportSpy).not.toHaveBeenCalled();
  });
});

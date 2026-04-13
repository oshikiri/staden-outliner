import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import * as FileStore from "../file";
import * as IncrementalImporter from "../importer/incremental_importer";
import { Block } from "../markdown/block";
import * as PageBlocks from "../sqlite/blocks";
import * as PageStore from "../sqlite/pages";

import * as ContentResolver from "./contentResolver";
import { getPageByTitle, updatePageByTitle } from "./pageService";

describe("pageService", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
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
    expect(page.id).toBe(page.pageId);
    expect(page.children).toHaveLength(1);
    expect(page.children[0].pageId).toBe(page.pageId);
    expect(resolvePageContentSpy).toHaveBeenCalledWith(page);
    expect(createNewFileSpy).not.toHaveBeenCalled();
  });

  test("updatePageByTitle creates a page record on the first save", async () => {
    const draftPage = new Block([], 0, [
      new Block([], 1, []).withId("child-1"),
    ]);
    draftPage.withId("page-1");
    draftPage.pageId = "page-1";
    draftPage.setProperty("title", "draft-page");

    jest.spyOn(PageBlocks, "getPageBlockByTitle").mockResolvedValue(undefined);
    jest.spyOn(PageStore, "getPageByTitle").mockResolvedValue(undefined);
    const createFileSpy = jest
      .spyOn(FileStore, "create")
      .mockResolvedValue({ title: "draft-page", pageId: "page-1" });
    const putFileSpy = jest.spyOn(PageStore, "putFile").mockResolvedValue({
      title: "draft-page",
      pageId: "page-1",
    });
    const importSpy = jest
      .spyOn(IncrementalImporter, "importBlockRecursive")
      .mockImplementation(async (page) => page);
    const resolvePageContentSpy = jest
      .spyOn(ContentResolver, "resolvePageContent")
      .mockImplementation(async (page) => page);

    const savedPage = await updatePageByTitle("draft-page", draftPage);

    expect(createFileSpy).toHaveBeenCalledWith("draft-page", "page-1");
    expect(putFileSpy).toHaveBeenCalled();
    expect(importSpy).toHaveBeenCalledWith(savedPage);
    expect(resolvePageContentSpy).toHaveBeenCalledWith(savedPage);
    expect(savedPage.id).toBe("page-1");
    expect(savedPage.pageId).toBe("page-1");
    expect(savedPage.children[0].parentId).toBe("page-1");
    expect(savedPage.getProperty("title")).toBe("draft-page");
  });
});

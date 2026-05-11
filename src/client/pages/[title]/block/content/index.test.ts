import { afterEach, describe, expect, jest, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  Block as BlockEntity,
  getContentMarkdown,
} from "@/shared/markdown/block";
import { Text } from "@/shared/markdown/token";

import {
  Content,
  enterEditModeFromClick,
  indentBlockAfterMarkdownUpdate,
  saveBlockContentMarkdown,
  splitBlockByMarkdown,
} from "./index";
import { useStore } from "../../state";

describe("content click edit mode", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    useStore.setState({
      page: null,
      editingBlockId: null,
      offset: null,
    });
  });

  test("enters edit mode and stores the cursor offset when editable content is clicked", () => {
    const setSaveErrorMessage = jest.fn();
    const stopPropagation = jest.fn();
    const getCursorOffset = jest.fn(() => 7);
    const { setEditingBlockId, setOffset } = useStore.getState();

    enterEditModeFromClick({
      editable: true,
      blockId: "block-1",
      clientX: 10,
      clientY: 20,
      setSaveErrorMessage,
      setEditingBlockId,
      setOffset,
      stopPropagation,
      getCursorOffset,
    });

    expect(setSaveErrorMessage).toHaveBeenCalledWith(null);
    expect(getCursorOffset).toHaveBeenCalledWith(10, 20);
    expect(useStore.getState().editingBlockId).toBe("block-1");
    expect(useStore.getState().offset).toBe(7);
    expect(stopPropagation).toHaveBeenCalled();
  });

  test("does not enter edit mode when the block id is missing", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const setSaveErrorMessage = jest.fn();
    const setEditingBlockId = jest.fn();
    const setOffset = jest.fn();
    const stopPropagation = jest.fn();
    const getCursorOffset = jest.fn(() => 7);

    enterEditModeFromClick({
      editable: true,
      blockId: undefined,
      clientX: 10,
      clientY: 20,
      setSaveErrorMessage,
      setEditingBlockId,
      setOffset,
      stopPropagation,
      getCursorOffset,
    });

    expect(setSaveErrorMessage).not.toHaveBeenCalled();
    expect(setEditingBlockId).not.toHaveBeenCalled();
    expect(getCursorOffset).not.toHaveBeenCalled();
    expect(setOffset).not.toHaveBeenCalled();
    expect(stopPropagation).not.toHaveBeenCalled();
  });

  test("does not enter edit mode when content is not editable", () => {
    const setSaveErrorMessage = jest.fn();
    const setEditingBlockId = jest.fn();
    const setOffset = jest.fn();
    const stopPropagation = jest.fn();
    const getCursorOffset = jest.fn(() => 7);

    enterEditModeFromClick({
      editable: false,
      blockId: "block-1",
      clientX: 10,
      clientY: 20,
      setSaveErrorMessage,
      setEditingBlockId,
      setOffset,
      stopPropagation,
      getCursorOffset,
    });

    expect(setSaveErrorMessage).not.toHaveBeenCalled();
    expect(setEditingBlockId).not.toHaveBeenCalled();
    expect(getCursorOffset).not.toHaveBeenCalled();
    expect(setOffset).not.toHaveBeenCalled();
    expect(stopPropagation).not.toHaveBeenCalled();
  });
});

describe("Content edit mode", () => {
  afterEach(() => {
    useStore.setState({
      page: null,
      editingBlockId: null,
      offset: null,
    });
  });

  test("renders block tokens outside edit mode", () => {
    const block = new BlockEntity([new Text("hello")], 0, []).withId("block-1");

    const markup = renderToStaticMarkup(
      createElement(Content, { block, editable: true }),
    );

    expect(markup).toContain("hello");
    expect(markup).toContain('data-block-id="block-1"');
  });
});

describe("saveBlockContentMarkdown", () => {
  test("applies markdown to the target block and saves the page", async () => {
    const child = new BlockEntity([new Text("before")], 1, []).withId("child");
    const page = new BlockEntity([], 0, [child]).withId("page");
    child.parent = page;
    const nextPage = new BlockEntity([], 0, []).withId("next-page");
    const updatePage = jest.fn(async () => nextPage);
    const setPage = jest.fn();
    const setSaveErrorMessage = jest.fn();

    await saveBlockContentMarkdown({
      page,
      blockId: "child",
      nextContentMarkdown: "after",
      updatePage,
      setPage,
      setSaveErrorMessage,
    });

    expect(getContentMarkdown(child)).toBe("after");
    expect(updatePage).toHaveBeenCalledWith(page);
    expect(setSaveErrorMessage).toHaveBeenCalledWith(null);
    expect(setPage).toHaveBeenCalledWith(nextPage);
  });

  test("does not save when the target block is missing", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const page = new BlockEntity([], 0, []).withId("page");
    const updatePage = jest.fn(async () => page);
    const setPage = jest.fn();
    const setSaveErrorMessage = jest.fn();

    await saveBlockContentMarkdown({
      page,
      blockId: "missing",
      nextContentMarkdown: "after",
      updatePage,
      setPage,
      setSaveErrorMessage,
    });

    expect(updatePage).not.toHaveBeenCalled();
    expect(setSaveErrorMessage).not.toHaveBeenCalled();
    expect(setPage).not.toHaveBeenCalled();
  });
});

describe("indentBlockAfterMarkdownUpdate", () => {
  test("applies current markdown before indenting the block", async () => {
    const first = new BlockEntity([new Text("first")], 1, []).withId("first");
    const second = new BlockEntity([new Text("before")], 1, []).withId(
      "second",
    );
    const page = new BlockEntity([], 0, [first, second]).withId("page");
    first.parent = page;
    second.parent = page;
    const updatePage = jest.fn(async () => page);
    const setPage = jest.fn();
    const setSaveErrorMessage = jest.fn();

    await indentBlockAfterMarkdownUpdate(page, "second", "after", false, {
      updatePage,
      setPage,
      setSaveErrorMessage,
    });

    expect(getContentMarkdown(second)).toBe("after");
    expect(second.parent?.id).toBe("first");
    expect(first.children).toContain(second);
    expect(updatePage).toHaveBeenCalledWith(page);
    expect(setSaveErrorMessage).toHaveBeenCalledWith(null);
    expect(setPage).toHaveBeenCalledWith(page);
  });
});

describe("splitBlockByMarkdown", () => {
  test("splits a block and saves the page", async () => {
    const child = new BlockEntity([new Text("beforeafter")], 1, []).withId(
      "child",
    );
    const page = new BlockEntity([], 0, [child]).withId("page");
    child.parent = page;
    const updatePage = jest.fn(async () => page);
    const setPage = jest.fn();
    const setSaveErrorMessage = jest.fn();

    const blockAfter = await splitBlockByMarkdown(
      page,
      "child",
      "before",
      "after",
      {
        updatePage,
        setPage,
        setSaveErrorMessage,
      },
    );

    expect(getContentMarkdown(child)).toBe("before");
    if (!blockAfter) {
      throw new Error("Expected the split block to be created");
    }
    expect(getContentMarkdown(blockAfter)).toBe("after");
    expect(page.children[1]).toBe(blockAfter);
    expect(updatePage).toHaveBeenCalledWith(page);
    expect(setSaveErrorMessage).toHaveBeenCalledWith(null);
    expect(setPage).toHaveBeenCalledWith(page);
  });
});

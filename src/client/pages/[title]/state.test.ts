import { afterEach, describe, expect, test } from "bun:test";

import { useStore } from "./state";

describe("page state", () => {
  afterEach(() => {
    useStore.setState({
      page: null,
      editingBlockId: null,
      offset: null,
    });
  });

  test("resetPageEditorState clears page-local editor state", () => {
    useStore.setState({
      page: null,
      editingBlockId: "page-1-child",
      offset: 12,
    });

    useStore.getState().resetPageEditorState();

    expect(useStore.getState().editingBlockId).toBe(null);
    expect(useStore.getState().offset).toBe(null);
  });
});

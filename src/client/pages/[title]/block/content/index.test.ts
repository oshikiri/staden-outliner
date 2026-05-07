import { afterEach, describe, expect, jest, test } from "bun:test";

import { enterEditModeFromClick } from "./index";
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

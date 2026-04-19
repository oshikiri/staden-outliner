import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";

import {
  appendAndSaveRecentPage,
  loadRecentPages,
  RECENT_PAGES_STORAGE_KEY,
  saveRecentPages,
} from "./recentPagesStorage";

describe("recentPagesStorage", () => {
  const localStorageMock = {
    getItem: jest.fn<(key: string) => string | null>(),
    setItem: jest.fn<(key: string, value: string) => void>(),
    clear: jest.fn<() => void>(),
  };

  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: localStorageMock,
      },
      configurable: true,
      writable: true,
    });
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
    localStorageMock.clear.mockReset();
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { window?: Window }).window;
  });

  test("loads an empty list when storage is empty", () => {
    localStorageMock.getItem.mockReturnValue(null);

    expect(loadRecentPages()).toEqual([]);
  });

  test("loads an empty list when storage contains invalid json", () => {
    localStorageMock.getItem.mockReturnValue("{invalid");

    expect(loadRecentPages()).toEqual([]);
  });

  test("saves and loads recent pages", () => {
    saveRecentPages(["a", "b"]);
    localStorageMock.getItem.mockReturnValue(JSON.stringify(["a", "b"]));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      RECENT_PAGES_STORAGE_KEY,
      JSON.stringify(["a", "b"]),
    );
    expect(loadRecentPages()).toEqual(["a", "b"]);
  });

  test("appends and persists a recent page", () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(["a", "b"]));

    expect(appendAndSaveRecentPage("c")).toEqual(["c", "a", "b"]);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      RECENT_PAGES_STORAGE_KEY,
      JSON.stringify(["c", "a", "b"]),
    );
  });
});

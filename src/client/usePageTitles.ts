import { useSyncExternalStore } from "react";

import { systemRpc } from "@/client/rpc/system";
import type { PageFileRecord } from "@/shared/file";
import { logError } from "@/shared/logger";

export function normalizePageTitles(files: PageFileRecord[]): string[] {
  return Array.from(new Set(files.map((file) => file.title))).sort();
}

type PageTitlesCacheEntry = {
  titles: string[] | undefined;
  promise: Promise<void> | null;
  listeners: Set<() => void>;
};

const pageTitlesCache = new Map<string, PageTitlesCacheEntry>();

function getCacheKey(prefix?: string): string {
  return prefix ?? "";
}

function getCacheEntry(prefix?: string): PageTitlesCacheEntry {
  const key = getCacheKey(prefix);
  const entry = pageTitlesCache.get(key);
  if (entry) {
    return entry;
  }

  const nextEntry: PageTitlesCacheEntry = {
    titles: undefined,
    promise: null,
    listeners: new Set(),
  };
  pageTitlesCache.set(key, nextEntry);
  return nextEntry;
}

function notifyCacheEntry(entry: PageTitlesCacheEntry): void {
  for (const listener of entry.listeners) {
    listener();
  }
}

function loadPageTitles(prefix?: string): void {
  const entry = getCacheEntry(prefix);
  if (entry.titles !== undefined || entry.promise) {
    return;
  }

  entry.promise = systemRpc
    .files(prefix)
    .then((files) => {
      entry.titles = normalizePageTitles(files);
    })
    .catch((error) => {
      logError("Failed to load page titles", error);
    })
    .finally(() => {
      entry.promise = null;
      notifyCacheEntry(entry);
    });
}

export function usePageTitles(prefix?: string): string[] | undefined {
  return useSyncExternalStore(
    (onStoreChange) => {
      const entry = getCacheEntry(prefix);
      entry.listeners.add(onStoreChange);
      loadPageTitles(prefix);

      return () => {
        entry.listeners.delete(onStoreChange);
      };
    },
    () => getCacheEntry(prefix).titles,
    () => getCacheEntry(prefix).titles,
  );
}

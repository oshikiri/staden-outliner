import { appendRecentPage } from "@/shared/recentPages";

export const RECENT_PAGES_STORAGE_KEY = "staden.recentPages";

export function loadRecentPages(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(RECENT_PAGES_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function saveRecentPages(pages: string[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(RECENT_PAGES_STORAGE_KEY, JSON.stringify(pages));
}

export function appendAndSaveRecentPage(pageTitle: string): string[] {
  const nextPages = appendRecentPage(loadRecentPages(), pageTitle);
  saveRecentPages(nextPages);
  return nextPages;
}

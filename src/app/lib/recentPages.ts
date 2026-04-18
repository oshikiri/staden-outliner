const MAX_RECENT_PAGES = 10;

export function appendRecentPage(
  pages: string[],
  pageTitle: string,
  maxRecentPages: number = MAX_RECENT_PAGES,
): string[] {
  const normalizedTitle = pageTitle.trim();
  if (!normalizedTitle) {
    return pages;
  }

  const nextPages = pages.filter((title) => title !== normalizedTitle);
  nextPages.unshift(normalizedTitle);
  return nextPages.slice(0, maxRecentPages);
}

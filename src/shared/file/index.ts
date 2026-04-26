/**
 * Metadata for a persisted page entry in the vault.
 *
 * This is not the browser's File object and does not imply that a file has
 * already been created on disk.
 */
export interface PageFileRecord {
  path?: string;
  title: string;
  pageId?: string | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPageFileRecord(value: unknown): value is PageFileRecord {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    (value.path === undefined || typeof value.path === "string") &&
    (value.pageId === undefined || typeof value.pageId === "string")
  );
}

export function createPageFileRecord(
  title: string,
  pageId: string,
): PageFileRecord {
  return {
    title,
    pageId,
  };
}

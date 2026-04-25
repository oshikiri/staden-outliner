export interface FileRecord {
  path?: string;
  title: string;
  pageId?: string | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isFile(value: unknown): value is FileRecord {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    (value.path === undefined || typeof value.path === "string") &&
    (value.pageId === undefined || typeof value.pageId === "string")
  );
}

export function createFileRecord(title: string, pageId: string): FileRecord {
  return {
    title,
    pageId,
  };
}

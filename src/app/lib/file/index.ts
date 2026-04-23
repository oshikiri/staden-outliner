import path from "node:path";

export interface File {
  path?: string;
  title: string;
  pageId?: string | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isFile(value: unknown): value is File {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    (value.path === undefined || typeof value.path === "string") &&
    (value.pageId === undefined || typeof value.pageId === "string")
  );
}

export async function create(title: string, pageId: string): Promise<File> {
  const file: File = {
    title,
    pageId,
  };
  return file;
}

export function extractTitle(filePath: string): string {
  const filename = path.basename(filePath);
  // TODO: handle meta characters in filename
  const title = filename
    .replace(/\.md$/i, "")
    .replaceAll("_", "-")
    .replaceAll("%20", " ")
    .replaceAll("%3A", ":")
    .replaceAll("%2F", "/");
  return title;
}

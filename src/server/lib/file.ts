import { readdirSync } from "node:fs";
import path from "node:path";

import { getStadenRoot } from "./env/stadenRoot";
import type { FileRecord } from "@/shared/file";

// https://blog.araya.dev/posts/2019-05-09-node-recursive-readdir/
function readdirRecursively(rootDir: string): string[] {
  let files = [];
  const dirs = [];
  const dirents = readdirSync(rootDir, { withFileTypes: true });
  for (const dirent of dirents) {
    const current = path.join(rootDir, dirent.name);
    if (dirent.isDirectory()) {
      dirs.push(current);
    }
    if (dirent.isFile()) {
      files.push(current);
    }
  }
  for (const dir of dirs) {
    files = files.concat(readdirRecursively(dir));
  }
  return files;
}

export async function listAllFilePaths(
  directoryPath: string,
): Promise<string[]> {
  const disallowedSegments = new Set([".recycle", "bak"]);
  return readdirRecursively(directoryPath)
    .map((filePath) => path.normalize(filePath))
    .filter((filePath) => filePath.endsWith(".md"))
    .filter((filePath) => {
      const segments = filePath.split(path.sep);
      return !segments.some((segment) => disallowedSegments.has(segment));
    });
}

export async function getLocalFile(path: string): Promise<string> {
  return Bun.file(path).text();
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

export function updateFile(file: FileRecord, content: string): Promise<void> {
  if (!file.path) {
    return Promise.reject(new Error("File path is not defined"));
  }

  return Bun.write(file.path, content).then(() => undefined);
}

export async function fillPathToFile(file: FileRecord): Promise<void> {
  if (!file.pageId) {
    throw new Error("File pageId is not defined");
  }
  const stadenRoot = getStadenRoot();
  const candidatePath = path.resolve(stadenRoot, `${file.title}.md`);
  const relative = path.relative(stadenRoot, candidatePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(
      `Invalid page title; resolved path escapes the vault root: ${file.title}`,
    );
  }

  file.path = candidatePath;
  const fileOnDisk = Bun.file(file.path);
  if (!(await fileOnDisk.exists())) {
    await Bun.write(file.path, "");
  }
}

import { readdirSync } from "fs";
import * as path from "path";
import * as fs from "fs";

export interface File {
  path?: string;
  title: string;
  pageId?: string | undefined;
}

export async function create(title: string, pageId: string): Promise<File> {
  const file: File = {
    title,
    pageId,
  };
  return file;
}

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

export function getLocalFile(path: string) {
  const data = fs.readFileSync(path);
  return data;
}

export function updateFile(file: File, content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!file.path) {
      reject(new Error("File path is not defined"));
      return;
    }
    fs.writeFile(file.path, content, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function fillPathToFile(file: File): Promise<void> {
  if (!file.pageId) {
    throw new Error("File pageId is not defined");
  }
  // RV: If `STADEN_ROOT` is unset, this writes to a relative path. Validate and fail early to avoid unexpected file writes.
  // RV(security): Potential filename issues with special characters (e.g., `../`); sanitize `file.title` to ensure valid filenames.
  file.path = path.join(process.env.STADEN_ROOT || "", file.title + ".md");
  if (!fs.existsSync(file.path)) {
    fs.writeFileSync(file.path, "");
  }
}

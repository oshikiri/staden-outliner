import { promises as fs } from "fs";
import path from "path";

import { getStadenRoot } from "@/app/lib/env/stadenRoot";

const stadenRoot = getStadenRoot();
const pagesRoot = path.join(stadenRoot, "pages");

export async function GET(req: Request) {
  const url = new URL(req.url || "");
  const queryPath: string = url.searchParams.get("path") || "";
  if (!queryPath) {
    return new Response("Missing path parameter", { status: 400 });
  }

  const normalizedQuery = path.normalize(queryPath);
  const imagePath = path.resolve(pagesRoot, normalizedQuery);
  const relative = path.relative(pagesRoot, imagePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return new Response("Invalid image path", { status: 400 });
  }

  const imageBuffer = await fs.readFile(imagePath);
  const mimeType = getMimeTypeFromPath(queryPath);
  return new Response(new Uint8Array(imageBuffer), {
    headers: {
      "Content-Type": mimeType,
    },
  });
}

const extensionToMime: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function getMimeTypeFromPath(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  return extensionToMime[extension] || "application/octet-stream";
}

import { promises as fs } from "fs";
import path from "path";

import { getStadenRoot } from "@/app/lib/env/stadenRoot";

type ImageSuccess = {
  ok: true;
  contentType: string;
  body: Uint8Array;
};

type ImageFailure = {
  ok: false;
  status: 400;
  message: string;
};

export type ImagePayload = ImageSuccess | ImageFailure;

export async function getImagePayload(
  queryPath: string,
): Promise<ImagePayload> {
  if (!queryPath) {
    return {
      ok: false,
      status: 400,
      message: "Missing path parameter",
    };
  }

  const stadenRoot = path.resolve(getStadenRoot());
  const imagePath = path.resolve(stadenRoot, queryPath);
  const relative = path.relative(stadenRoot, imagePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return {
      ok: false,
      status: 400,
      message: "Invalid image path",
    };
  }

  const imageBuffer = await fs.readFile(imagePath);
  return {
    ok: true,
    body: new Uint8Array(imageBuffer),
    contentType: getMimeTypeFromPath(queryPath),
  };
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

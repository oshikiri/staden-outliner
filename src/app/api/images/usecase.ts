import path from "node:path";

import { getStadenRoot } from "@/app/lib/env/stadenRoot";

type ImageSuccess = {
  ok: true;
  contentType: string;
  body: Uint8Array;
};

type ImageFailure = {
  ok: false;
  status: 400 | 404;
  message: string;
};

export type ImagePayload = ImageSuccess | ImageFailure;

async function readImageBuffer(
  imagePath: string,
): Promise<Uint8Array | ImageFailure> {
  const file = Bun.file(imagePath);
  if (!(await file.exists())) {
    return {
      ok: false,
      status: 404,
      message: "Image not found",
    };
  }

  return new Uint8Array(await file.arrayBuffer());
}

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

  const imageBuffer = await readImageBuffer(imagePath);
  if (!(imageBuffer instanceof Uint8Array)) {
    return imageBuffer;
  }

  return {
    ok: true,
    body: imageBuffer,
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

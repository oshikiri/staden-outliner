import { promises as fs } from "fs";
import path from "path";

// @owner Using an empty default for `STADEN_ROOT` may read from the CWD unintentionally. Validate that it is set and is an absolute, expected path.
const stadenRoot = process.env.STADEN_ROOT || "";

export async function GET(req: Request) {
  const url = new URL(req.url || "");
  const queryPath: string = url.searchParams.get("path") || "";
  // @owner Potential path traversal. Normalize and ensure the resolved path stays under `${stadenRoot}/pages` before reading.
  const imagePath = path.join(stadenRoot + "/pages/", queryPath);
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

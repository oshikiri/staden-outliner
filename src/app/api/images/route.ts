import { promises as fs } from "fs";
import path from "path";

// RV: Using an empty default for `STADEN_ROOT` may read from the CWD unintentionally. Validate that it is set and is an absolute, expected path.
const stadenRoot = process.env.STADEN_ROOT || "";

export async function GET(req: Request) {
  const url = new URL(req.url || "");
  const queryPath: string = url.searchParams.get("path") || "";
  // RV: Potential path traversal. Normalize and ensure the resolved path stays under `${stadenRoot}/pages` before reading.
  const imagePath = path.join(stadenRoot + "/pages/", queryPath);
  const imageBuffer = await fs.readFile(imagePath);
  // RV: Content-Type is hardcoded to image/png. Detect MIME type from file extension or content to avoid incorrect headers.
  return new Response(new Uint8Array(imageBuffer), {
    headers: {
      "Content-Type": "image/png",
    },
  });
}

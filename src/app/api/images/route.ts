import { promises as fs } from "fs";
import path from "path";

const stadenRoot = process.env.STADEN_ROOT || "";

export async function GET(req: Request) {
  const url = new URL(req.url || "");
  const queryPath: string = url.searchParams.get("path") || "";
  const imagePath = path.join(stadenRoot + "/pages/", queryPath);
  const imageBuffer = await fs.readFile(imagePath);
  return new Response(new Uint8Array(imageBuffer), {
    headers: {
      "Content-Type": "image/png",
    },
  });
}

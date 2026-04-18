import { binaryResponse, textResponse } from "../_shared/http";
import { getImagePayload } from "./usecase";

export async function GET(req: Request) {
  const url = new URL(req.url || "");
  const queryPath: string = url.searchParams.get("path") || "";
  const payload = await getImagePayload(queryPath);
  if (!payload.ok) {
    return textResponse(payload.message, { status: payload.status });
  }

  return binaryResponse(payload.body, payload.contentType);
}

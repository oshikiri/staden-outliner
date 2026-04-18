import { jsonResponse } from "../_shared/http";
import { getFilesPayload } from "./usecase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const prefix = url.searchParams.get("prefix") || "";
  // @owner Validate `prefix` length and characters to prevent expensive queries and injection attempts.
  return jsonResponse(await getFilesPayload(prefix));
}

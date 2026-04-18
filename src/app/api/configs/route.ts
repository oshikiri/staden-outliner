import { jsonResponse } from "../_shared/http";
import { getConfigsPayload } from "./usecase";

export async function GET() {
  return jsonResponse(await getConfigsPayload());
}

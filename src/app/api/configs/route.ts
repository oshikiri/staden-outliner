import { honoApiApp } from "../hono/app";
import { buildInternalApiRequest } from "../hono/internalRequest";

export async function GET(
  req: Request = buildInternalApiRequest("/api/configs"),
) {
  return honoApiApp.fetch(req);
}

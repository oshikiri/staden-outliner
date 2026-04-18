import { honoInitializeApp } from "../hono/initializeApp";
import { buildInternalApiRequest } from "../hono/internalRequest";

export async function POST(
  req: Request = buildInternalApiRequest("/api/initialize", { method: "POST" }),
) {
  return honoInitializeApp.fetch(req);
}

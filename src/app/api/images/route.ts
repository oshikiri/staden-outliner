import { honoApiApp } from "../hono/app";

export async function GET(req: Request) {
  return honoApiApp.fetch(req);
}

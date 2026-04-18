import { honoApiApp } from "./app";
import { honoInitializeApp } from "./initializeApp";

export function resolveApiApp(req: Request) {
  const { pathname } = new URL(req.url);
  if (pathname === "/api/initialize") {
    return honoInitializeApp;
  }
  return honoApiApp;
}

export async function GET(req: Request): Promise<Response> {
  return resolveApiApp(req).fetch(req);
}

export async function POST(req: Request): Promise<Response> {
  return resolveApiApp(req).fetch(req);
}

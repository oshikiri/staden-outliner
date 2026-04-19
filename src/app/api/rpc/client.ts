import { hc } from "hono/client";

import type { AppType } from "../hono/app";

export const client = hc<AppType>("/");

export const forceCacheRequest = {
  init: {
    cache: "force-cache" as const,
  },
};

export function ensureOkResponse(response: Response): void {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
}

export async function readJsonResponse<T>(response: Response): Promise<T> {
  ensureOkResponse(response);
  return response.json() as Promise<T>;
}

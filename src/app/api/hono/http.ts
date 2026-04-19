import type { Context } from "hono";
import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status";

export type ApiEnv = {
  Variables: Record<never, never>;
};

export type ApiContext = Context<ApiEnv>;

export function jsonResponse<T, U extends ContentfulStatusCode>(
  c: ApiContext,
  body: T,
  status: U = 200 as U,
) {
  return c.json(body, status);
}

export function textResponse<T extends string, U extends ContentfulStatusCode>(
  c: ApiContext,
  body: T,
  status: U = 200 as U,
) {
  return c.text(body, status);
}

export function binaryResponse(
  c: ApiContext,
  body: ArrayBuffer | Uint8Array,
  contentType: string,
  status: ContentfulStatusCode = 200,
): Response {
  c.header("Content-Type", contentType);
  c.header("Cross-Origin-Resource-Policy", "cross-origin");
  const responseBody = body instanceof Uint8Array ? new Uint8Array(body) : body;
  return c.newResponse(responseBody, status);
}

export function noContentResponse(
  c: ApiContext,
  status: StatusCode = 204,
): Response {
  return c.body(null, status);
}

export function internalServerError(c: ApiContext): Response {
  return textResponse(c, "Internal Server Error", 500);
}

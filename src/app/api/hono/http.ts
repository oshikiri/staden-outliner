import type { Context } from "hono";
import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status";

export type ApiEnv = {
  Variables: Record<never, never>;
};

export type ApiContext = Context<ApiEnv>;
export type Validated<T> = T | Response;

export function jsonResponse<T>(
  c: ApiContext,
  body: T,
  status: ContentfulStatusCode = 200,
): Response {
  return c.json(body, status);
}

export function textResponse(
  c: ApiContext,
  body: string,
  status: ContentfulStatusCode = 200,
): Response {
  return c.text(body, status);
}

export async function optionalJsonBody<T>(c: ApiContext): Promise<T | null> {
  try {
    return await c.req.json<T>();
  } catch {
    return null;
  }
}

export function requiredQuery(
  c: ApiContext,
  name: string,
  message: string = `Missing ${name} parameter`,
): Validated<string> {
  const value = c.req.query(name);
  if (!value) {
    return textResponse(c, message, 400);
  }
  return value;
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

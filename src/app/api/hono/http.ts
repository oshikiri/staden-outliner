import type { Context } from "hono";
import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status";

export type ApiEnv = {
  Variables: Record<never, never>;
};

export type ApiContext = Context<ApiEnv>;

export function requiredQuery(
  c: ApiContext,
  name: string,
  message: string = `Missing ${name} parameter`,
): string | Response {
  const value = c.req.query(name);
  if (!value) {
    return c.text(message, 400);
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
  return c.text("Internal Server Error", 500);
}

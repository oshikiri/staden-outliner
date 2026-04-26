import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status";
import type { Context } from "hono";

export type GlobalErrorResponse = {
  message: string;
};

export function binaryResponse(
  c: Context,
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
  c: Context,
  status: StatusCode = 204,
): Response {
  return c.body(null, status);
}

export function internalServerError(c: Context): Response {
  return c.json({ message: "Internal Server Error" }, 500);
}

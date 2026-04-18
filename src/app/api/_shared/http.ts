export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: withContentType(init.headers, "application/json"),
  });
}

export function textResponse(body: string, init: ResponseInit = {}): Response {
  return new Response(body, {
    ...init,
    headers: withContentType(init.headers, "text/plain; charset=utf-8"),
  });
}

export function binaryResponse(
  body: ArrayBuffer | Uint8Array,
  contentType: string,
  init: ResponseInit = {},
): Response {
  return new Response(body as BodyInit, {
    ...init,
    headers: withContentType(init.headers, contentType),
  });
}

export function noContentResponse(init: ResponseInit = {}): Response {
  return new Response(null, {
    ...init,
    status: init.status ?? 204,
  });
}

function withContentType(
  headersInit: HeadersInit | undefined,
  contentType: string,
): Headers {
  const headers = new Headers(headersInit);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", contentType);
  }
  return headers;
}

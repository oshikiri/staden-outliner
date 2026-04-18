const INTERNAL_API_ORIGIN = "http://internal.invalid";

export function buildInternalApiRequest(
  path: string,
  init: RequestInit = {},
  baseRequest?: Request,
): Request {
  const baseUrl = baseRequest
    ? new URL(baseRequest.url)
    : new URL(INTERNAL_API_ORIGIN);
  const url = new URL(path, baseUrl);
  return new Request(url, init);
}

const INTERNAL_API_ORIGIN = "http://internal.invalid";

export function buildInternalApiRequest(
  path: string,
  init: RequestInit | Request = {},
  baseRequest?: Request,
): Request {
  const requestBase =
    baseRequest || (init instanceof Request ? init : undefined);
  const baseUrl = requestBase
    ? new URL(requestBase.url)
    : new URL(INTERNAL_API_ORIGIN);
  const url = new URL(path, baseUrl);
  return new Request(url, init);
}

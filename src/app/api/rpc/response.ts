type PageRouteErrorLike = {
  updateResults?: {
    message?: unknown;
  };
};

type JsonValidator<T> = (value: unknown) => value is T;

function createFallbackMessage(
  statusCode: number,
  contentType: string,
): string {
  return `Request failed: ${statusCode} (${contentType || "unknown"})`;
}

function readErrorMessage(
  data: unknown,
  statusCode: number,
  contentType: string,
): string {
  if (data && typeof data === "object") {
    const pageRouteError = data as PageRouteErrorLike;
    const pageRouteMessage = pageRouteError.updateResults?.message;
    if (typeof pageRouteMessage === "string") {
      return pageRouteMessage;
    }

    if ("message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string") {
        return message;
      }
    }
  }

  return createFallbackMessage(statusCode, contentType);
}

async function toRequestError(response: Response): Promise<Error> {
  const contentType = response.headers.get("Content-Type") ?? "";
  const fallback = new Error(
    createFallbackMessage(response.status, contentType),
  );

  if (contentType.includes("application/json")) {
    try {
      const data = await response.json();
      return new Error(readErrorMessage(data, response.status, contentType));
    } catch {
      return fallback;
    }
  }

  try {
    const text = await response.text();
    if (text.length > 0) {
      return new Error(text);
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function isArrayOf<T>(
  value: unknown,
  validator: JsonValidator<T>,
): value is T[] {
  return Array.isArray(value) && value.every(validator);
}

export function isEmptyObject(value: unknown): value is Record<string, never> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  );
}

export async function readJsonResponse<T>(
  response: Response,
  expectedStatus = 200,
  validator?: JsonValidator<T>,
): Promise<T> {
  if (response.status !== expectedStatus) {
    throw await toRequestError(response);
  }

  const json = await response.json();
  if (validator && !validator(json)) {
    throw new Error(`Unexpected response shape: ${response.status}`);
  }

  return json as T;
}

export async function expectStatus(
  response: Response,
  expectedStatus: number,
): Promise<void> {
  if (response.status !== expectedStatus) {
    throw await toRequestError(response);
  }
}

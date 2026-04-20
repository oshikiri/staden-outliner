type PageRouteErrorLike = {
  updateResults?: {
    message?: unknown;
  };
};

function readErrorMessage(data: unknown, statusCode: number): string {
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

  return `Request failed: ${statusCode}`;
}

async function toRequestError(response: Response): Promise<Error> {
  const contentType = response.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = await response.json();
      return new Error(readErrorMessage(data, response.status));
    } catch {
      return new Error(`Request failed: ${response.status}`);
    }
  }

  try {
    const text = await response.text();
    if (text.length > 0) {
      return new Error(text);
    }
  } catch {
    return new Error(`Request failed: ${response.status}`);
  }

  return new Error(`Request failed: ${response.status}`);
}

export async function readJsonResponse<T>(
  response: Response,
  expectedStatus = 200,
): Promise<T> {
  if (response.status !== expectedStatus) {
    throw await toRequestError(response);
  }

  return (await response.json()) as T;
}

export async function expectStatus(
  response: Response,
  expectedStatus: number,
): Promise<void> {
  if (response.status !== expectedStatus) {
    throw await toRequestError(response);
  }
}

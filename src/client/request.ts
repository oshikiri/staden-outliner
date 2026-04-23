export type AbortableRequestOptions = {
  signal?: AbortSignal;
};

export function toRequestInit(
  options?: AbortableRequestOptions,
): RequestInit | undefined {
  if (!options?.signal) {
    return undefined;
  }

  return {
    signal: options.signal,
  };
}

export function isAbortError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  return "name" in error && (error as { name?: unknown }).name === "AbortError";
}

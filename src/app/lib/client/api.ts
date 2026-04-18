"use client";

export function getApiBaseUrl(): string | undefined {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return baseUrl ? baseUrl : undefined;
}

export function apiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return path;
  }
  return new URL(path, baseUrl).toString();
}

export function apiFetch(
  path: string,
  init?: Parameters<typeof fetch>[1],
): Promise<Response> {
  return fetch(apiUrl(path), init);
}

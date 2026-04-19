"use client";

export function apiFetch(
  path: string,
  init?: Parameters<typeof fetch>[1],
): Promise<Response> {
  return fetch(path, init);
}

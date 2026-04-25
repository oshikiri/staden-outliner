import { DEFAULT_PORT } from "./defaultPort";

const DEFAULT_HOST = "http://localhost";

export function resolveAllowedOrigin(
  rawValue: string | undefined,
  port: number | undefined = DEFAULT_PORT,
): string {
  if (!rawValue) {
    return `${DEFAULT_HOST}:${resolvePort(port)}`;
  }

  const trimmed = rawValue.trim();
  return trimmed.length > 0 ? trimmed : `${DEFAULT_HOST}:${resolvePort(port)}`;
}

function resolvePort(port: number | undefined): number {
  return typeof port === "number" && Number.isFinite(port)
    ? port
    : DEFAULT_PORT;
}

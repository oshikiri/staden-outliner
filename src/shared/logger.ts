function write(method: "log" | "warn" | "error", ...args: unknown[]): void {
  console[method](...args);
}

export function logDebug(...args: unknown[]): void {
  write("log", ...args);
}

export function logInfo(...args: unknown[]): void {
  write("log", ...args);
}

export function logWarn(...args: unknown[]): void {
  write("warn", ...args);
}

export function logError(...args: unknown[]): void {
  write("error", ...args);
}

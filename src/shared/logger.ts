type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

const DEFAULT_LOG_LEVEL: LogLevel = "info";

function shouldLog(requiredLevel: LogLevel): boolean {
  return LOG_LEVEL_ORDER[requiredLevel] <= LOG_LEVEL_ORDER[getLogLevel()];
}

function getLogLevel(): LogLevel {
  const rawLevel = typeof Bun !== "undefined" ? Bun.env.LOG_LEVEL : undefined;
  if (!rawLevel) {
    return DEFAULT_LOG_LEVEL;
  }

  const normalized = rawLevel.trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(LOG_LEVEL_ORDER, normalized)) {
    return normalized as LogLevel;
  }

  return DEFAULT_LOG_LEVEL;
}

export function logDebug(...args: unknown[]): void {
  if (!shouldLog("debug")) {
    return;
  }

  console.debug(...args);
}

export function logInfo(...args: unknown[]): void {
  if (!shouldLog("info")) {
    return;
  }

  console.info(...args);
}

export function logWarn(...args: unknown[]): void {
  if (!shouldLog("warn")) {
    return;
  }

  console.warn(...args);
}

export function logError(...args: unknown[]): void {
  if (!shouldLog("error")) {
    return;
  }

  console.error(...args);
}

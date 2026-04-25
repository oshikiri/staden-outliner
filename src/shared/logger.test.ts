import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";

import { logDebug, logError, logInfo, logWarn } from "./logger";

const originalLogLevel = Bun.env.LOG_LEVEL;

describe("logger", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    if (originalLogLevel === undefined) {
      delete Bun.env.LOG_LEVEL;
      return;
    }

    Bun.env.LOG_LEVEL = originalLogLevel;
  });

  test("defaults to info level and suppresses debug", () => {
    const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

    delete Bun.env.LOG_LEVEL;
    logDebug("debug message");
    logInfo("info message");

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith("info message");
  });

  test("enables debug logging when configured", () => {
    const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});

    Bun.env.LOG_LEVEL = "debug";
    logDebug("debug message");

    expect(debugSpy).toHaveBeenCalledWith("debug message");
  });

  test("suppresses info when configured for warn", () => {
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    Bun.env.LOG_LEVEL = "warn";
    logInfo("info message");
    logWarn("warn message");
    logError("error message");

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith("warn message");
    expect(errorSpy).toHaveBeenCalledWith("error message");
  });
});

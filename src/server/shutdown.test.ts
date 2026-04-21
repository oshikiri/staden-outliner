import { describe, expect, jest, test } from "bun:test";

import { createShutdownHandler } from "./shutdown";

describe("createShutdownHandler", () => {
  test("runs stop before close only once", async () => {
    const order: string[] = [];
    const shutdown = createShutdownHandler({
      stop: () => {
        order.push("stop");
      },
      close: async () => {
        order.push("close");
      },
    });

    await shutdown();
    await shutdown();

    expect(order).toEqual(["stop", "close"]);
  });

  test("propagates close failures after stopping", async () => {
    const stop = jest.fn();
    const shutdown = createShutdownHandler({
      stop,
      close: async () => {
        throw new Error("close failed");
      },
    });

    await expect(shutdown()).rejects.toThrow("close failed");
    expect(stop).toHaveBeenCalledTimes(1);
    await shutdown();
    expect(stop).toHaveBeenCalledTimes(1);
  });
});

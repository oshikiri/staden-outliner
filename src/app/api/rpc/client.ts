import { hc, type ApplyGlobalResponse } from "hono/client";

import type { AppType } from "../hono/app";

type AppTypeWithGlobalResponse = ApplyGlobalResponse<
  AppType,
  {
    500: {
      text: string;
    };
  }
>;

export const client = hc<AppTypeWithGlobalResponse>("/");

export const forceCacheRequest = {
  init: {
    cache: "force-cache" as const,
  },
};

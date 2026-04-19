import { hc } from "hono/client";

import type { AppType } from "../hono/app";

export const client = hc<AppType>("/");

export const forceCacheRequest = {
  init: {
    cache: "force-cache" as const,
  },
};

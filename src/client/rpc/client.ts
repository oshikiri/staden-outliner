import { hc } from "hono/client";

import type { AppType } from "@/server/api/app";

export const client = hc<AppType>("/");

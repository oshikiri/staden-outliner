import { hc } from "hono/client";

import type { AppType } from "@/app/api/app";

export const client = hc<AppType>("/");

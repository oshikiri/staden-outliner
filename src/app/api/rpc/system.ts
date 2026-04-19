import type { Configs } from "@/app/lib/file/config";
import type { File } from "@/app/lib/file";

import { parseResponse } from "hono/client";

import { client, forceCacheRequest } from "./client";

export const systemRpc = {
  async configs(): Promise<Configs> {
    return parseResponse(
      await client.api.configs.$get(undefined, forceCacheRequest),
    );
  },
  async files(prefix?: string): Promise<File[]> {
    return parseResponse(
      await client.api.files.$get(
        {
          query: prefix ? { prefix } : {},
        },
        forceCacheRequest,
      ),
    );
  },
  async initialize(): Promise<void> {
    const response = await client.api.initialize.$post();
    if (response.status !== 204) {
      throw new Error(`Request failed: ${response.status}`);
    }
  },
};

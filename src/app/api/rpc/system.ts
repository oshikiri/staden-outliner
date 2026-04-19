import type { Configs } from "@/app/lib/file/config";
import type { File } from "@/app/lib/file";

import {
  client,
  forceCacheRequest,
  readJsonResponse,
  readNoContentResponse,
} from "./client";

export const systemRpc = {
  async configs(): Promise<Configs> {
    return readJsonResponse<Configs>(
      await client.api.configs.$get(undefined, forceCacheRequest),
    );
  },
  async files(prefix?: string): Promise<File[]> {
    return readJsonResponse<File[]>(
      await client.api.files.$get(
        {
          query: prefix ? { prefix } : {},
        },
        forceCacheRequest,
      ),
    );
  },
  async initialize(): Promise<void> {
    await readNoContentResponse(await client.api.initialize.$post());
  },
};

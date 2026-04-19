import type { Configs } from "@/app/lib/file/config";
import type { File } from "@/app/lib/file";
import type { InferResponseType } from "hono/client";

import { client, forceCacheRequest } from "./client";

type ConfigsResponse = InferResponseType<typeof client.api.configs.$get>;
type FilesResponse = InferResponseType<typeof client.api.files.$get>;

export const systemRpc = {
  async configs(): Promise<Configs> {
    const response = await client.api.configs.$get(
      undefined,
      forceCacheRequest,
    );
    return response.json() as Promise<ConfigsResponse>;
  },
  async files(prefix?: string): Promise<File[]> {
    const response = await client.api.files.$get(
      {
        query: prefix ? { prefix } : {},
      },
      forceCacheRequest,
    );
    return response.json() as Promise<FilesResponse>;
  },
  async initialize(): Promise<void> {
    const response = await client.api.initialize.$post();
    if (response.status !== 204) {
      throw new Error(`Request failed: ${response.status}`);
    }
  },
};

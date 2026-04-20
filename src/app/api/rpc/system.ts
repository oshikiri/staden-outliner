import type { Configs } from "@/app/lib/file/config";
import type { File } from "@/app/lib/file";
import type { InferRequestType } from "hono/client";

import { client, forceCacheRequest } from "./client";

type FilesRequest = InferRequestType<typeof client.api.files.$get>;

export const systemRpc = {
  async configs(): Promise<Configs> {
    const response = await client.api.configs.$get(
      undefined,
      forceCacheRequest,
    );
    return response.json() as Promise<Configs>;
  },
  async files(prefix?: string): Promise<File[]> {
    const request: FilesRequest = {
      query: {
        prefix: prefix ?? "",
      },
    };
    const response = await client.api.files.$get(request, forceCacheRequest);
    return response.json() as Promise<File[]>;
  },
  async initialize(): Promise<void> {
    await client.api.initialize.$post();
  },
};

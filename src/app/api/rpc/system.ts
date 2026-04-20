import type { Configs } from "@/app/lib/file/config";
import type { File } from "@/app/lib/file";
import type { InferRequestType, InferResponseType } from "hono/client";

import { client, forceCacheRequest } from "./client";
import { expectStatus, readJsonResponse } from "./response";

type FilesRequest = InferRequestType<typeof client.api.files.$get>;
type ConfigsResponse = InferResponseType<typeof client.api.configs.$get, 200>;
type FilesResponse = InferResponseType<typeof client.api.files.$get, 200>;

export const systemRpc = {
  async configs(): Promise<Configs> {
    const response = await client.api.configs.$get(
      undefined,
      forceCacheRequest,
    );
    return readJsonResponse<ConfigsResponse>(response);
  },
  async files(prefix?: string): Promise<File[]> {
    const request: FilesRequest = {
      query: {
        prefix: prefix ?? "",
      },
    };
    const response = await client.api.files.$get(request, forceCacheRequest);
    return readJsonResponse<FilesResponse>(response);
  },
  async initialize(): Promise<void> {
    const response = await client.api.initialize.$post();
    await expectStatus(response, 204);
  },
};

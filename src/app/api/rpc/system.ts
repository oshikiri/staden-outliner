import type { Configs } from "@/app/lib/file/config";
import { isConfigs } from "@/app/lib/file/config";
import type { File } from "@/app/lib/file";
import { isFile } from "@/app/lib/file";
import type { InferRequestType } from "hono/client";

import { client, forceCacheRequest } from "./client";
import { isArrayOf, expectStatus, readJsonResponse } from "./response";

type FilesRequest = InferRequestType<typeof client.api.files.$get>;

export const systemRpc = {
  async configs(): Promise<Configs> {
    const response = await client.api.configs.$get(
      undefined,
      forceCacheRequest,
    );
    return readJsonResponse<Configs>(response, 200, isConfigs);
  },
  async files(prefix?: string): Promise<File[]> {
    const request: FilesRequest = {
      query: {
        prefix: prefix ?? "",
      },
    };
    const response = await client.api.files.$get(request, forceCacheRequest);
    return readJsonResponse<File[]>(
      response,
      200,
      (value: unknown): value is File[] => isArrayOf(value, isFile),
    );
  },
  async initialize(): Promise<void> {
    const response = await client.api.initialize.$post();
    await expectStatus(response, 204);
  },
};

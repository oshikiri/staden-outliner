import type { Configs } from "@/shared/file/config";
import { isConfigs } from "@/shared/file/config";
import type { PageFileRecord } from "@/shared/file";
import { isPageFileRecord } from "@/shared/file";
import type { InferRequestType } from "hono/client";

import { client } from "./client";
import { isArrayOf, readJsonResponse } from "./response";
import { type AbortableRequestOptions, toRequestInit } from "@/client/request";

type FilesRequest = InferRequestType<typeof client.api.files.$get>;

export const systemRpc = {
  async configs(options?: AbortableRequestOptions): Promise<Configs> {
    const response = await client.api.configs.$get(undefined, {
      init: toRequestInit(options),
    });
    return readJsonResponse<Configs>(response, 200, isConfigs);
  },
  async files(
    prefix?: string,
    options?: AbortableRequestOptions,
  ): Promise<PageFileRecord[]> {
    const request: FilesRequest = {
      query: {
        prefix: prefix ?? "",
      },
    };
    const response = await client.api.files.$get(request, {
      init: toRequestInit(options),
    });
    return readJsonResponse<PageFileRecord[]>(
      response,
      200,
      (value: unknown): value is PageFileRecord[] =>
        isArrayOf(value, isPageFileRecord),
    );
  },
};

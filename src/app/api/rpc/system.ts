import type { Configs } from "@/shared/file/config";
import { isConfigs } from "@/shared/file/config";
import type { File } from "@/shared/file";
import { isFile } from "@/shared/file";
import type { InferRequestType } from "hono/client";

import { client } from "./client";
import { isArrayOf, expectStatus, readJsonResponse } from "./response";
import {
  type AbortableRequestOptions,
  toRequestInit,
} from "@/app/lib/client/request";

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
  ): Promise<File[]> {
    const request: FilesRequest = {
      query: {
        prefix: prefix ?? "",
      },
    };
    const response = await client.api.files.$get(request, {
      init: toRequestInit(options),
    });
    return readJsonResponse<File[]>(
      response,
      200,
      (value: unknown): value is File[] => isArrayOf(value, isFile),
    );
  },
  async initialize(options?: AbortableRequestOptions): Promise<void> {
    const response = await client.api.initialize.$post(undefined, {
      init: toRequestInit(options),
    });
    await expectStatus(response, 204);
  },
};

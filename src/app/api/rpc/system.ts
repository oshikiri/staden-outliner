import type { Configs } from "@/app/lib/file/config";
import type { File } from "@/app/lib/file";
import {
  parseResponse,
  type InferRequestType,
  type InferResponseType,
} from "hono/client";

import { client, forceCacheRequest } from "./client";

type ParsedResponse = Parameters<typeof parseResponse>[0];
type FilesRequest = InferRequestType<typeof client.api.files.$get>;
type ConfigsResponse = InferResponseType<typeof client.api.configs.$get, 200>;
type FilesResponse = InferResponseType<typeof client.api.files.$get, 200>;

export const systemRpc = {
  async configs(): Promise<Configs> {
    const response = client.api.configs.$get(undefined, forceCacheRequest);
    return parseResponse(
      response as unknown as ParsedResponse,
    ) as Promise<ConfigsResponse>;
  },
  async files(prefix?: string): Promise<File[]> {
    const request: FilesRequest = {
      query: prefix ? { prefix } : {},
    };
    const response = client.api.files.$get(request, forceCacheRequest);
    return parseResponse(
      response as unknown as ParsedResponse,
    ) as Promise<FilesResponse>;
  },
  async initialize(): Promise<void> {
    const response = client.api.initialize.$post();
    await parseResponse(response as unknown as ParsedResponse);
  },
};

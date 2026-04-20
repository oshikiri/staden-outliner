import type { Configs } from "@/app/lib/file/config";
import type { File } from "@/app/lib/file";
import { parseResponse, type InferRequestType } from "hono/client";

import { client, forceCacheRequest } from "./client";

type ParsedResponse = Parameters<typeof parseResponse>[0];
type FilesRequest = InferRequestType<typeof client.api.files.$get>;

async function parseJsonResponse(response: ParsedResponse) {
  return parseResponse(response);
}

export const systemRpc = {
  async configs(): Promise<Configs> {
    const response = client.api.configs.$get(undefined, forceCacheRequest);
    return parseJsonResponse(response);
  },
  async files(prefix?: string): Promise<File[]> {
    const request: FilesRequest = {
      query: {
        prefix: prefix ?? "",
      },
    };
    const response = client.api.files.$get(request, forceCacheRequest);
    return parseJsonResponse(response);
  },
  async initialize(): Promise<void> {
    const response = client.api.initialize.$post();
    await parseJsonResponse(response);
  },
};

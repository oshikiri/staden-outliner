import type { Block as BlockEntity } from "@/app/lib/markdown/block";
import type { BlockDto } from "@/app/lib/markdown/blockDto";
import { fromBlockDto, toPageDto } from "@/app/lib/markdown/blockDto";
import {
  DetailedError,
  parseResponse,
  type InferRequestType,
  type InferResponseType,
} from "hono/client";
import { isPageRouteError } from "../contracts";

import { client, forceCacheRequest } from "./client";

function encodeTitle(title: string): string {
  return encodeURIComponent(title);
}

type PageRouteClient = (typeof client.api.pages)[":title"];
type ParsedResponse = Parameters<typeof parseResponse>[0];
type PageGetRequest = InferRequestType<PageRouteClient["$get"]>;
type PageUpdateRequest = InferRequestType<PageRouteClient["$post"]>;
type PageGetSuccessResponse = InferResponseType<PageRouteClient["$get"], 200>;
type PageGetErrorResponse = InferResponseType<PageRouteClient["$get"], 400>;
type PageBacklinksSuccessResponse = InferResponseType<
  PageRouteClient["backlinks"]["$get"],
  200
>;
type PageUpdateMarkdownResponse = InferResponseType<
  PageRouteClient["update_markdown"]["$post"]
>;

function pageParam(title: string): PageGetRequest["param"] {
  return {
    title: encodeTitle(title),
  };
}

function readPageError(error: unknown): Error {
  if (error instanceof DetailedError) {
    const detail = error.detail as { data?: unknown } | undefined;
    const data = detail?.data as PageGetErrorResponse | undefined;
    if (data && isPageRouteError(data)) {
      return new Error(data.updateResults.message);
    }
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string") {
        return new Error(message);
      }
    }
    if (typeof error.statusCode === "number") {
      return new Error(`Request failed: ${error.statusCode}`);
    }
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error("Request failed");
}

async function readPageRpcResponse(
  response: ParsedResponse,
): Promise<BlockEntity> {
  try {
    const json = (await parseResponse(response)) as PageGetSuccessResponse;
    return fromBlockDto(json as BlockDto);
  } catch (error) {
    throw readPageError(error);
  }
}

export const pageRpc = {
  async get(title: string): Promise<BlockEntity> {
    const response = client.api.pages[":title"].$get({
      param: pageParam(title),
    });
    return readPageRpcResponse(response);
  },
  async update(page: BlockEntity | null): Promise<BlockEntity | null> {
    if (!page) {
      return null;
    }
    const pageTitle = page.getProperty("title") as string;
    const request: PageUpdateRequest = {
      param: pageParam(pageTitle),
      json: toPageDto(page),
    };
    const response = client.api.pages[":title"].$post(request);
    return readPageRpcResponse(response);
  },
  async backlinks(title: string): Promise<BlockEntity[]> {
    const response = client.api.pages[":title"].backlinks.$get(
      {
        param: pageParam(title),
      },
      forceCacheRequest,
    );
    const json = (await parseResponse(
      response,
    )) as PageBacklinksSuccessResponse;
    return json.map((block) => fromBlockDto(block));
  },
  async reflectMarkdown(title: string): Promise<PageUpdateMarkdownResponse> {
    const response = client.api.pages[":title"].update_markdown.$post({
      param: pageParam(title),
    });
    return parseResponse(response);
  },
};

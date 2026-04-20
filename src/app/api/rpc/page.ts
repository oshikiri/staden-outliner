import type { Block as BlockEntity } from "@/app/lib/markdown/block";
import type { BlockDto } from "@/app/lib/markdown/blockDto";
import { fromBlockDto, toPageDto } from "@/app/lib/markdown/blockDto";
import { type InferRequestType, type InferResponseType } from "hono/client";
import { isPageRouteError, type PageRouteError } from "../contracts";

import { client, forceCacheRequest } from "./client";

function encodeTitle(title: string): string {
  return encodeURIComponent(title);
}

type PageRouteClient = (typeof client.api.pages)[":title"];
type PageGetRequest = InferRequestType<PageRouteClient["$get"]>;
type PageUpdateRequest = InferRequestType<PageRouteClient["$post"]>;
type PageGetErrorResponse = InferResponseType<PageRouteClient["$get"], 400>;
type PageUpdateMarkdownResponse = InferResponseType<
  PageRouteClient["update_markdown"]["$post"]
>;

function pageParam(title: string): PageGetRequest["param"] {
  return {
    title: encodeTitle(title),
  };
}

function readPageError(data: unknown, statusCode: number): Error {
  if (data && isPageRouteError(data as PageRouteError)) {
    return new Error((data as PageRouteError).updateResults.message);
  }
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string") {
      return new Error(message);
    }
  }
  return new Error(`Request failed: ${statusCode}`);
}

async function readPageRpcResponse(
  response:
    | Awaited<ReturnType<PageRouteClient["$get"]>>
    | Awaited<ReturnType<PageRouteClient["$post"]>>,
): Promise<BlockEntity> {
  if (response.status !== 200) {
    const data = (await response.json()) as PageGetErrorResponse;
    throw readPageError(data, response.status);
  }
  const json = (await response.json()) as BlockDto;
  return fromBlockDto(json);
}

export const pageRpc = {
  async get(title: string): Promise<BlockEntity> {
    const response = await client.api.pages[":title"].$get({
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
    const response = await client.api.pages[":title"].$post(request);
    return readPageRpcResponse(response);
  },
  async backlinks(title: string): Promise<BlockEntity[]> {
    const response = await client.api.pages[":title"].backlinks.$get(
      {
        param: pageParam(title),
      },
      forceCacheRequest,
    );
    const json = (await response.json()) as BlockDto[];
    return json.map((block) => fromBlockDto(block));
  },
  async reflectMarkdown(title: string): Promise<PageUpdateMarkdownResponse> {
    const response = await client.api.pages[":title"].update_markdown.$post({
      param: pageParam(title),
    });
    return response.json() as Promise<PageUpdateMarkdownResponse>;
  },
};

import type { Block as BlockEntity } from "@/app/lib/markdown/block";
import { fromBlockDto, toPageDto } from "@/app/lib/markdown/blockDto";
import { type InferRequestType, type InferResponseType } from "hono/client";
import { isPageRouteError } from "../pages/[title]/contracts";

import { client, forceCacheRequest } from "./client";
import { readJsonResponse } from "./response";

function encodeTitle(title: string): string {
  return encodeURIComponent(title);
}

type PageRouteClient = (typeof client.api.pages)[":title"];
type PageGetRequest = InferRequestType<PageRouteClient["$get"]>;
type PageUpdateRequest = InferRequestType<PageRouteClient["$post"]>;
type PageGetResponse = InferResponseType<PageRouteClient["$get"], 200>;
type PageUpdateResponse = InferResponseType<PageRouteClient["$post"], 200>;
type PageBacklinksResponse = InferResponseType<
  PageRouteClient["backlinks"]["$get"],
  200
>;
type PageUpdateMarkdownResponse = InferResponseType<
  PageRouteClient["update_markdown"]["$post"],
  200
>;

function pageParam(title: string): PageGetRequest["param"] {
  return {
    title: encodeTitle(title),
  };
}

async function readPageRpcResponse(
  response:
    | Awaited<ReturnType<PageRouteClient["$get"]>>
    | Awaited<ReturnType<PageRouteClient["$post"]>>,
): Promise<BlockEntity> {
  const json = await readJsonResponse<PageGetResponse | PageUpdateResponse>(
    response,
  );
  if (isPageRouteError(json)) {
    throw new Error(json.updateResults.message);
  }
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
    const json = await readJsonResponse<PageBacklinksResponse>(response);
    return json.map((block) => fromBlockDto(block));
  },
  async reflectMarkdown(title: string): Promise<PageUpdateMarkdownResponse> {
    const response = await client.api.pages[":title"].update_markdown.$post({
      param: pageParam(title),
    });
    return readJsonResponse<PageUpdateMarkdownResponse>(response);
  },
};

import type { Block as BlockEntity } from "@/app/lib/markdown/block";
import { fromBlockDto, toPageDto } from "@/app/lib/markdown/blockDto";
import type { InferResponseType } from "hono/client";
import { isPageRouteError } from "../contracts";

import { client, forceCacheRequest } from "./client";

function encodeTitle(title: string): string {
  return encodeURIComponent(title);
}

function pageTitleParam(title: string): { title: string } {
  return { title: encodeTitle(title) };
}

type PageRouteClient = (typeof client.api.pages)[":title"];
type PageGetSuccessResponse = InferResponseType<PageRouteClient["$get"], 200>;
type PageGetErrorResponse = InferResponseType<PageRouteClient["$get"], 400>;
type PageUpdateSuccessResponse = InferResponseType<
  PageRouteClient["$post"],
  200
>;
type PageUpdateErrorResponse = InferResponseType<PageRouteClient["$post"], 400>;
type PageBacklinksSuccessResponse = InferResponseType<
  PageRouteClient["backlinks"]["$get"],
  200
>;
type PageUpdateMarkdownResponse = InferResponseType<
  PageRouteClient["update_markdown"]["$post"]
>;

async function readPageRpcResponse(response: Response): Promise<BlockEntity> {
  const json = (await response.json()) as
    | PageGetSuccessResponse
    | PageGetErrorResponse;
  if (response.status === 400) {
    if (isPageRouteError(json)) {
      throw new Error(json.updateResults.message);
    }
    throw new Error(`Request failed: ${response.status}`);
  }
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  if (isPageRouteError(json)) {
    throw new Error(json.updateResults.message);
  }
  return fromBlockDto(json);
}

async function readPageUpdateResponse(
  response: Response,
): Promise<BlockEntity> {
  const json = (await response.json()) as
    | PageUpdateSuccessResponse
    | PageUpdateErrorResponse;
  if (response.status === 400) {
    if (isPageRouteError(json)) {
      throw new Error(json.updateResults.message);
    }
    throw new Error(`Request failed: ${response.status}`);
  }
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  if (isPageRouteError(json)) {
    throw new Error(json.updateResults.message);
  }
  return fromBlockDto(json);
}

export const pageRpc = {
  async get(title: string): Promise<BlockEntity> {
    const response = await client.api.pages[":title"].$get({
      param: pageTitleParam(title),
    });
    return readPageRpcResponse(response);
  },
  async update(page: BlockEntity | null): Promise<BlockEntity | null> {
    if (!page) {
      return null;
    }
    const pageTitle = page.getProperty("title") as string;
    const response = await client.api.pages[":title"].$post({
      param: pageTitleParam(pageTitle),
      json: toPageDto(page),
    });
    return readPageUpdateResponse(response);
  },
  async backlinks(title: string): Promise<BlockEntity[]> {
    const response = await client.api.pages[":title"].backlinks.$get(
      {
        param: pageTitleParam(title),
      },
      forceCacheRequest,
    );
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    const json = (await response.json()) as PageBacklinksSuccessResponse;
    return json.map((block) => fromBlockDto(block));
  },
  async reflectMarkdown(title: string): Promise<PageUpdateMarkdownResponse> {
    const response = await client.api.pages[":title"].update_markdown.$post({
      param: pageTitleParam(title),
    });
    return response.json() as Promise<PageUpdateMarkdownResponse>;
  },
};

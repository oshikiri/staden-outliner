import type { Block as BlockEntity } from "@/app/lib/markdown/block";
import { fromBlockDto, toPageDto } from "@/app/lib/markdown/blockDto";
import { parseResponse } from "hono/client";
import type { InferResponseType } from "hono/client";

import { client, forceCacheRequest } from "./client";

function encodeTitle(title: string): string {
  return encodeURIComponent(title);
}

function pageTitleParam(title: string): { title: string } {
  return { title: encodeTitle(title) };
}

type PageRouteClient = (typeof client.api.pages)[":title"];
type PageGetRequest = PageRouteClient["$get"];
type PagePostRequest = PageRouteClient["$post"];
type PageBacklinksRequest = PageRouteClient["backlinks"]["$get"];
type PageUpdateMarkdownRequest = PageRouteClient["update_markdown"]["$post"];

type PageGetSuccess = InferResponseType<PageGetRequest, 200>;
type PageGetError = InferResponseType<PageGetRequest, 400>;
type PagePostSuccess = InferResponseType<PagePostRequest, 200>;
type PagePostError = InferResponseType<PagePostRequest, 400>;
type PageBacklinksResponse = InferResponseType<PageBacklinksRequest>;
type UpdateMarkdownResponse = InferResponseType<PageUpdateMarkdownRequest>;

async function readPageRpcResponse(
  response: Awaited<ReturnType<PageGetRequest>>,
): Promise<BlockEntity> {
  if (response.status === 400) {
    const json: PageGetError = await response.json();
    throw new Error(json.updateResults.message);
  }
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  const json: PageGetSuccess = await response.json();
  return fromBlockDto(json);
}

async function readPageUpdateResponse(
  response: Awaited<ReturnType<PagePostRequest>>,
): Promise<BlockEntity> {
  if (response.status === 400) {
    const json: PagePostError = await response.json();
    throw new Error(json.updateResults.message);
  }
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  const json: PagePostSuccess = await response.json();
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
    const json: PageBacklinksResponse = await parseResponse(
      client.api.pages[":title"].backlinks.$get(
        {
          param: pageTitleParam(title),
        },
        forceCacheRequest,
      ),
    );
    return json.map((block) => fromBlockDto(block));
  },
  async reflectMarkdown(title: string): Promise<UpdateMarkdownResponse> {
    return parseResponse(
      client.api.pages[":title"].update_markdown.$post({
        param: pageTitleParam(title),
      }),
    );
  },
};

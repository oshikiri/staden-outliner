import type { Block as BlockEntity } from "@/app/lib/markdown/block";
import { fromBlockDto, toPageDto } from "@/app/lib/markdown/blockDto";

import {
  type BacklinksRouteResponseBody,
  isPageRouteError,
  type PageRouteResponseBody,
  type UpdateMarkdownRouteResponseBody,
} from "../contracts";
import { client, forceCacheRequest, readJsonResponse } from "./client";

function encodeTitle(title: string): string {
  return encodeURIComponent(title);
}

function pageTitleParam(title: string): { title: string } {
  return { title: encodeTitle(title) };
}

async function readPageRpcResponse(response: Response): Promise<BlockEntity> {
  const json = (await response.json()) as PageRouteResponseBody;
  if (!response.ok) {
    if (isPageRouteError(json)) {
      throw new Error(json.updateResults.message);
    }
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
    return readPageRpcResponse(response);
  },
  async backlinks(title: string): Promise<BlockEntity[]> {
    const response = await client.api.pages[":title"].backlinks.$get(
      {
        param: pageTitleParam(title),
      },
      forceCacheRequest,
    );
    const json = await readJsonResponse<BacklinksRouteResponseBody>(response);
    return json.map((block) => fromBlockDto(block));
  },
  async reflectMarkdown(
    title: string,
  ): Promise<UpdateMarkdownRouteResponseBody> {
    const response = await client.api.pages[":title"].update_markdown.$post({
      param: pageTitleParam(title),
    });
    return readJsonResponse<UpdateMarkdownRouteResponseBody>(response);
  },
};

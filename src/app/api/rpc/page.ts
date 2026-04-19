import type { Block as BlockEntity } from "@/app/lib/markdown/block";
import { fromBlockDto, toPageDto } from "@/app/lib/markdown/blockDto";

import {
  type BacklinksRouteResponseBody,
  isPageRouteError,
  type PageRouteResponseBody,
  type UpdateMarkdownRouteResponseBody,
} from "../contracts";
import { client, forceCacheRequest, readJsonResponse } from "./client";

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
      param: {
        title: encodeURIComponent(title),
      },
    });
    return readPageRpcResponse(response);
  },
  async update(page: BlockEntity | null): Promise<BlockEntity | null> {
    if (!page) {
      return null;
    }
    const pageTitle = page.getProperty("title") as string;
    const response = await client.api.pages[":title"].$post({
      param: {
        title: encodeURIComponent(pageTitle),
      },
      json: toPageDto(page),
    });
    return readPageRpcResponse(response);
  },
  async backlinks(title: string): Promise<BlockEntity[]> {
    const response = await client.api.pages[":title"].backlinks.$get(
      {
        param: {
          title: encodeURIComponent(title),
        },
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
      param: {
        title: encodeURIComponent(title),
      },
    });
    return readJsonResponse<UpdateMarkdownRouteResponseBody>(response);
  },
};

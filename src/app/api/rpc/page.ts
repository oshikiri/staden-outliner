import type { Block as BlockEntity } from "@/app/lib/markdown/block";
import {
  type BlockDto,
  fromBlockDto,
  isBlockDto,
  toPageDto,
} from "@/app/lib/markdown/blockDto";
import { type InferRequestType, type InferResponseType } from "hono/client";

import { client, forceCacheRequest } from "./client";
import { expectStatus, isArrayOf, readJsonResponse } from "./response";

function encodeTitle(title: string): string {
  return encodeURIComponent(title);
}

type PageRouteClient = (typeof client.api.pages)[":title"];
type PageGetRequest = InferRequestType<PageRouteClient["$get"]>;
type PageUpdateRequest = InferRequestType<PageRouteClient["$post"]>;
type PageBacklinksResponse = InferResponseType<
  PageRouteClient["backlinks"]["$get"],
  200
>;

function pageParam(title: string): PageGetRequest["param"] {
  return {
    title: encodeTitle(title),
  };
}

function isBlockDtoArray(value: unknown): value is PageBacklinksResponse {
  return isArrayOf(value, isBlockDto);
}

export const pageRpc = {
  async get(title: string): Promise<BlockEntity> {
    const response = await client.api.pages[":title"].$get({
      param: pageParam(title),
    });
    const json = await readJsonResponse<BlockDto>(response, 200, isBlockDto);
    return fromBlockDto(json);
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
    const json = await readJsonResponse<BlockDto>(response, 200, isBlockDto);
    return fromBlockDto(json);
  },
  async backlinks(title: string): Promise<BlockEntity[]> {
    const response = await client.api.pages[":title"].backlinks.$get(
      {
        param: pageParam(title),
      },
      forceCacheRequest,
    );
    const json = await readJsonResponse<PageBacklinksResponse>(
      response,
      200,
      isBlockDtoArray,
    );
    return json.map((block) => fromBlockDto(block));
  },
  async reflectMarkdown(title: string): Promise<void> {
    const response = await client.api.pages[":title"].update_markdown.$post({
      param: pageParam(title),
    });
    await expectStatus(response, 204);
  },
};

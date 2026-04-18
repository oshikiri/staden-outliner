import type { Configs } from "@/app/lib/file/config";
import type { File } from "@/app/lib/file";
import { Block } from "@/app/lib/markdown/block";
import { BlockDto, fromBlockDto, toPageDto } from "@/app/lib/markdown/blockDto";

export type PageRouteError = {
  updateResults: {
    status: "unchanged";
    message: string;
  };
};

export type PageRouteRequestBody = BlockDto;
export type PageRouteResponseBody = BlockDto | PageRouteError;
export type BacklinksRouteResponseBody = BlockDto[];
export type UpdateMarkdownRouteResponseBody = Record<string, never>;

export const initializeRoutePath = "/api/initialize";
export const configsRoutePath = "/api/configs";
export const filesRoutePath = (prefix?: string): string => {
  if (!prefix) {
    return "/api/files";
  }
  return `/api/files?${new URLSearchParams({ prefix }).toString()}`;
};

export const pageRoutePath = (title: string): string => {
  return `/api/pages/${encodeURIComponent(title)}`;
};

export const pageBacklinksRoutePath = (title: string): string => {
  return `${pageRoutePath(title)}/backlinks`;
};

export const pageUpdateMarkdownRoutePath = (title: string): string => {
  return `${pageRoutePath(title)}/update_markdown`;
};

export function createPageRouteError(message: string): PageRouteError {
  return {
    updateResults: {
      status: "unchanged",
      message,
    },
  };
}

export function isPageRouteError(
  payload: PageRouteResponseBody,
): payload is PageRouteError {
  return "updateResults" in payload;
}

export function serializePageRequest(page: Block): string {
  return JSON.stringify(toPageDto(page));
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (text.trim() === "") {
    throw new Error("Empty JSON response");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid JSON response");
  }
}

export async function readPageResponse(response: Response): Promise<Block> {
  if (!response.ok) {
    const json = await parseJsonResponse<PageRouteResponseBody>(response).catch(
      () => null,
    );
    if (json && isPageRouteError(json)) {
      throw new Error(json.updateResults.message);
    }
    throw new Error(`Request failed: ${response.status}`);
  }
  const json = await parseJsonResponse<PageRouteResponseBody>(response);
  if (isPageRouteError(json)) {
    throw new Error(json.updateResults.message);
  }
  return fromBlockDto(json);
}

export async function readBacklinksResponse(
  response: Response,
): Promise<Block[]> {
  ensureOkResponse(response);
  const json = await parseJsonResponse<BacklinksRouteResponseBody>(response);
  return json.map((block) => fromBlockDto(block));
}

export async function readConfigsResponse(
  response: Response,
): Promise<Configs> {
  ensureOkResponse(response);
  const json = await parseJsonResponse<Partial<Configs>>(response);
  return {
    favorites: Array.isArray(json.favorites) ? json.favorites : [],
  };
}

export async function readFilesResponse(response: Response): Promise<File[]> {
  ensureOkResponse(response);
  return parseJsonResponse<File[]>(response);
}

export async function expectEmptyJsonResponse(
  response: Response,
): Promise<Record<string, never>> {
  ensureOkResponse(response);
  return parseJsonResponse<Record<string, never>>(response);
}

export async function expectNoContentResponse(
  response: Response,
): Promise<void> {
  ensureOkResponse(response);
}

function ensureOkResponse(response: Response): void {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
}

import { Block } from "@/app/lib/markdown/block";
import { BlockDto, toPageDto } from "@/app/lib/markdown/blockDto";

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

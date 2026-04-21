import { BlockDto } from "@/app/lib/markdown/blockDto";

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

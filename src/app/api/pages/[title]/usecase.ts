import { BlockDto, fromBlockDto, toPageDto } from "@/app/lib/markdown/blockDto";
import { getPageByTitle, updatePageByTitle } from "@/app/lib/page/pageService";

type UpdateResults = {
  status: "unchanged";
  message: string;
};

export type PageRouteError = {
  updateResults: UpdateResults;
};

export async function getPagePayload(
  title: string,
): Promise<BlockDto | PageRouteError> {
  if (!title) {
    return createPageRouteError("Missing title");
  }

  const page = await getPageByTitle(title);
  return toPageDto(page);
}

export async function updatePagePayload(
  title: string,
  pagePayload: BlockDto | null,
): Promise<BlockDto | PageRouteError> {
  if (!title) {
    return createPageRouteError("Missing title");
  }
  if (!pagePayload) {
    return createPageRouteError("Missing page content");
  }

  const updatedPage = await updatePageByTitle(title, fromBlockDto(pagePayload));
  return toPageDto(updatedPage);
}

export function isPageRouteError(
  payload: BlockDto | PageRouteError,
): payload is PageRouteError {
  return "updateResults" in payload;
}

function createPageRouteError(message: string): PageRouteError {
  return {
    updateResults: {
      status: "unchanged",
      message,
    },
  };
}

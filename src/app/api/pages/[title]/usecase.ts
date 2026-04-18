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

  /**
   * NOTE: When updating the entire content via POST `/pages/[title]`,
   * - The old version on the client side
   * - The new version on the client side
   * - The latest version on the server side
   * need to be 3-way merged.
   *
   * In this case, it seems more reasonable to send only the diff to the server for updating,
   * so this implementation might not be ideal.
   */
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

import {
  createPageRouteError,
  type PageRouteRequestBody,
  type PageRouteResponseBody,
} from "./contracts";
import { fromBlockDto, toPageDto } from "@/shared/markdown/blockDto";
import {
  getPageByTitle,
  updatePageByTitle,
} from "@/server/lib/page/pageService";

export async function getPagePayload(
  title: string,
): Promise<PageRouteResponseBody> {
  const page = await getPageByTitle(title);
  return toPageDto(page);
}

export async function updatePagePayload(
  title: string,
  pagePayload: PageRouteRequestBody | null,
): Promise<PageRouteResponseBody> {
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

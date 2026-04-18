import { Block as BlockEntity } from "@/app/lib/markdown/block";
import { apiFetch } from "@/app/lib/client/api";
import {
  pageRoutePath,
  readPageResponse,
  serializePageRequest,
} from "@/app/api/contracts";

export async function postPage(
  page: BlockEntity | null,
): Promise<BlockEntity | null> {
  if (!page) {
    return null;
  }
  const pageTitle = page.getProperty("title") as string;
  const response = await apiFetch(pageRoutePath(pageTitle), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: serializePageRequest(page),
  });
  return readPageResponse(response);
}

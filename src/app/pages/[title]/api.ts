import { Block as BlockEntity } from "@/app/lib/markdown/block";
import { apiFetch } from "@/app/lib/client/api";
import { pageRoutePath, readPageResponse } from "@/app/api/contracts";

export async function getPageByTitle(title: string): Promise<BlockEntity> {
  // @owner No error handling or timeout; add try/catch and handle non-200 responses.
  const response = await apiFetch(pageRoutePath(title));
  return readPageResponse(response);
}

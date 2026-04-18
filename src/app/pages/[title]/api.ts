import { Block as BlockEntity } from "@/app/lib/markdown/block";
import { BlockDto, fromBlockDto } from "@/app/lib/markdown/blockDto";
import { apiFetch } from "@/app/lib/client/api";

export async function getPageByTitle(
  title: string,
): Promise<BlockEntity | null> {
  // @owner No error handling or timeout; add try/catch and handle non-200 responses.
  const response = await apiFetch(`/api/pages/${encodeURIComponent(title)}`);
  const json: BlockDto = await response.json();
  return fromBlockDto(json);
}

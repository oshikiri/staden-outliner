import { Block as BlockEntity } from "@/app/lib/markdown/block";
import { fromBlockDto, toPageDto } from "@/app/lib/markdown/blockDto";
import { apiFetch } from "@/app/lib/client/api";

export async function postPage(
  page: BlockEntity | null,
): Promise<BlockEntity | null> {
  if (!page) {
    return null;
  }
  const pageTitle = page.getProperty("title") as string;
  const encodedTitle = encodeURIComponent(pageTitle);
  const response = await apiFetch(`/api/pages/${encodedTitle}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toPageDto(page)),
  });
  return fromBlockDto(await response.json());
}

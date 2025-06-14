import {
  Block as BlockEntity,
  create as createBlock,
} from "@/app/lib/markdown/block";

export async function getPageByTitle(
  title: string,
): Promise<BlockEntity | null> {
  const response = await fetch(`/api/pages/${encodeURIComponent(title)}`);
  const json = await response.json();
  return createBlock(json);
}

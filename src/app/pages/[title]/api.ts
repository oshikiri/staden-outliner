import {
  Block as BlockEntity,
  create as createBlock,
} from "@/app/lib/markdown/block";

export async function getPageByTitle(
  title: string,
): Promise<BlockEntity | null> {
  // @owner No error handling or timeout; add try/catch and handle non-200 responses.
  const response = await fetch(`/api/pages/${encodeURIComponent(title)}`);
  const json = await response.json();
  return createBlock(json);
}

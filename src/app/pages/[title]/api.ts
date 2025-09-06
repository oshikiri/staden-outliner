import {
  Block as BlockEntity,
  create as createBlock,
} from "@/app/lib/markdown/block";

export async function getPageByTitle(
  title: string,
): Promise<BlockEntity | null> {
  const response = await fetch(`/api/pages/${encodeURIComponent(title)}`);
  // RV: Verify response.ok before parsing JSON to avoid unhandled HTTP errors.
  const json = await response.json();
  return createBlock(json);
}

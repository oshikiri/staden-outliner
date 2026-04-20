import { Block } from "@/app/lib/markdown/block";
import { toBlockDto } from "@/app/lib/markdown/blockDto";
import { getCurrentPage, getSourceLinks } from "@/app/lib/sqlite";
import { type BacklinksRouteResponseBody } from "../contracts";

export async function getBacklinkPayload(
  title: string,
): Promise<BacklinksRouteResponseBody> {
  const sourceIds = await getSourceLinks(title);
  const sourceBlocks = await Promise.all(sourceIds.map(resolveBacklink));

  return sourceBlocks.map(({ block, pageId }) => toBlockDto(block, { pageId }));
}

async function resolveBacklink(
  sourceId: string,
): Promise<{ block: Block; pageId: string }> {
  const pageBlock = await getCurrentPage(sourceId);
  if (!pageBlock.id) {
    throw new Error(`Page block id is missing for source: ${sourceId}`);
  }
  const sourceBlock = pageBlock.getBlockById(sourceId);

  let currentBlock: Block | undefined = sourceBlock?.parent || undefined;
  let ancestors = currentBlock?.getContentMarkdownHead();
  currentBlock = currentBlock?.parent;
  while (currentBlock && currentBlock != pageBlock) {
    ancestors = currentBlock.getContentMarkdownHead() + " > " + ancestors;
    currentBlock = currentBlock.parent;
  }
  if (!sourceBlock?.properties) {
    sourceBlock!.properties = [];
  }
  sourceBlock?.properties?.push(["ancestors", ancestors]);

  return { block: sourceBlock!, pageId: pageBlock.id };
}

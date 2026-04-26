import { createPageFileRecord, type PageFileRecord } from "@/shared/file";
import { Block } from "@/shared/markdown/block";
import { getPageRefTitles } from "@/shared/markdown/utils";
import { logDebug } from "@/shared/logger";

import {
  batchInsertLinks,
  deleteLinksByFromId,
  getPagesByTitles,
} from "@/server/lib/sqlite";
import { putFile } from "@/server/lib/sqlite/pageStore";
import { batchInsertBlocks } from "@/server/lib/sqlite/blocks";

export async function importBlockRecursive(block: Block): Promise<Block> {
  const pageId = block.id;
  if (!pageId) {
    throw new Error("Root block id is required for persistence");
  }
  await refreshLinksFromBlock(block);
  await batchInsertBlocks(block.flatten(), 1000, { defaultPageId: pageId });
  return block;
}

async function refreshLinksFromBlock(block: Block): Promise<void> {
  const fromBlockId = block.id || "";

  await deleteLinksByFromId(fromBlockId);
  const targetTitles: string[] = getPageRefTitles(block.content);
  const targetPages: PageFileRecord[] = await getPagesByTitles(targetTitles);
  const links: [string, string][] = targetPages.map((page) => [
    fromBlockId,
    page.pageId || "",
  ]);

  if (links.length > 0) {
    logDebug("batchInsertLinks", { count: links.length });
    await batchInsertLinks(links);
  }
}

export async function createNewFileWithEmptyBlock(
  title: string,
  pageId: string | undefined,
): Promise<{
  block: Block;
  file: PageFileRecord;
}> {
  if (!pageId) {
    pageId = crypto.randomUUID();
  }
  const file = createPageFileRecord(title, pageId);
  const child = new Block([], 1, []).withId(crypto.randomUUID());
  const page = new Block([], 0, [child]).withId(pageId);
  child.parent = page;

  await putFile(file);
  await batchInsertBlocks([page, child], 2, { defaultPageId: pageId });

  return { block: page, file };
}

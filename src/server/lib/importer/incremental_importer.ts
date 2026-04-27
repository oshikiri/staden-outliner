import { createPageFileRecord, type PageFileRecord } from "@/shared/file";
import { Block } from "@/shared/markdown/block";
import { getPageRefTitles } from "@/shared/markdown/utils";
import { logDebug } from "@/shared/logger";

import * as SqliteLinks from "@/server/lib/sqlite/links";
import * as PageStore from "@/server/lib/sqlite/pageStore";
import * as SqliteBlocks from "@/server/lib/sqlite/blocks";

export function importBlockRecursive(block: Block): Block {
  const pageId = block.id;
  if (!pageId) {
    throw new Error("Root block id is required for persistence");
  }
  refreshLinksFromBlock(block);
  SqliteBlocks.batchInsertBlocks(block.flatten(), 1000, {
    defaultPageId: pageId,
  });
  return block;
}

function refreshLinksFromBlock(block: Block): void {
  const fromBlockId = block.id || "";

  SqliteLinks.deleteLinksByFromId(fromBlockId);
  const targetTitles: string[] = getPageRefTitles(block.content);
  const targetPages: PageFileRecord[] =
    PageStore.getPagesByTitles(targetTitles);
  const links: [string, string][] = targetPages.map((page) => [
    fromBlockId,
    page.pageId || "",
  ]);

  if (links.length > 0) {
    logDebug("batchInsertLinks", { count: links.length });
    SqliteLinks.batchInsertLinks(links);
  }
}

export function createNewFileWithEmptyBlock(
  title: string,
  pageId: string | undefined,
): {
  block: Block;
  file: PageFileRecord;
} {
  if (!pageId) {
    pageId = crypto.randomUUID();
  }
  const file = createPageFileRecord(title, pageId);
  const child = new Block([], 1, []).withId(crypto.randomUUID());
  const page = new Block([], 0, [child]).withId(pageId);
  child.parent = page;

  PageStore.putFile(file);
  SqliteBlocks.batchInsertBlocks([page, child], 2, { defaultPageId: pageId });

  return { block: page, file };
}

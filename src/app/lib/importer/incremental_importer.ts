import { randomUUID } from "crypto";

import { File, create as createFile } from "../file";
import { Block, refreshBlockFromPageUpdate } from "../markdown/block";
import { getPageRefTitles } from "@/app/lib/markdown/utils";

import {
  batchInsertLinks,
  deleteLinksByFromId,
  getPagesByTitles,
} from "@/app/lib/sqlite";
import { putFile } from "@/app/lib/sqlite/pages";
import { batchInsertBlocks } from "../sqlite/blocks";

export async function importBlockRecursive(block: Block): Promise<Block> {
  const blockUpdated = refreshBlockFromPageUpdate(block);
  await refreshLinksFromBlock(blockUpdated);
  // RV: FIXME left: contentMarkdown should be reflected to content before persisting; otherwise DB may store stale tokens.
  await batchInsertBlocks(blockUpdated.flatten(), 1000);
  return blockUpdated;
}

async function refreshLinksFromBlock(block: Block): Promise<void> {
  const fromBlockId = block.id || "";

  await deleteLinksByFromId(fromBlockId);
  const targetTitles: string[] = getPageRefTitles(block.content);
  const targetPages: File[] = await getPagesByTitles(targetTitles);
  const links: [string, string][] = targetPages.map((page) => [
    fromBlockId,
    page.pageId || "",
  ]);

  if (links.length > 0) {
    // RV: Remove verbose logging of link tuples in production to avoid leaking IDs and flooding logs.
    console.log("batchInsertLinks", links);
    await batchInsertLinks(links);
  }
}

export async function createNewFileWithEmptyBlock(
  title: string,
  pageId: string | undefined,
): Promise<{
  block: Block;
  file: File;
}> {
  if (!pageId) {
    pageId = randomUUID();
  }
  const file = await createFile(title, pageId);
  const child = new Block([], 1, []).withId(randomUUID());
  const page = new Block([], 0, [child]).withId(pageId);
  child.pageId = pageId;
  child.parentId = page.id;
  page.pageId = pageId;

  await putFile(file);
  await batchInsertBlocks([page, child], 2);

  return { block: page, file };
}

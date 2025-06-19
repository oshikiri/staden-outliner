import { randomUUID } from "crypto";

import { File, create as createFile } from "../file";
import { Block, refleshBlockFromPageUpdate } from "../markdown/block";
import { getPageRefTitles } from "@/app/lib/markdown/utils";

import {
  batchInsertEdges,
  deleteEdgesByFromId,
  getPagesByTitles,
} from "@/app/lib/sqlite";
import { putFile } from "@/app/lib/sqlite/pages";
import { batchInsertBlocks } from "../sqlite/blocks";

export async function importBlockRecursive(block: Block): Promise<Block> {
  const blockUpdated = refleshBlockFromPageUpdate(block);
  await refreshEdgesFromBlock(blockUpdated);
  // FIXME: ここの前にcontentMarkdownをcontentに詰める必要がある
  await batchInsertBlocks(blockUpdated.flatten(), 1000);
  return blockUpdated;
}

async function refreshEdgesFromBlock(block: Block): Promise<void> {
  const fromBlockId = block.id || "";

  await deleteEdgesByFromId(fromBlockId);
  const targetTitles: string[] = getPageRefTitles(block.content);
  const targetPages: File[] = await getPagesByTitles(targetTitles);
  const edges: [string, string][] = targetPages.map((page) => [
    fromBlockId,
    page.pageId || "",
  ]);

  if (edges.length > 0) {
    console.log("batchInsertEdges", edges);
    await batchInsertEdges(edges);
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

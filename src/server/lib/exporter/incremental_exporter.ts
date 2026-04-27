import { Block } from "@/shared/markdown/block";
import { updateFile, fillPathToFile } from "../file";
import { logInfo } from "@/shared/logger";
import * as PageBlocks from "@/server/lib/sqlite/blocks";
import * as PageStore from "@/server/lib/sqlite/pageStore";

export async function exportOnePageToMarkdown(
  pageTitle: string,
): Promise<string> {
  const file = await PageStore.getPageByTitle(pageTitle);
  if (!file) {
    throw new Error(`Page with title "${pageTitle}" not found.`);
  }

  if (!file.path) {
    await fillPathToFile(file);
    PageStore.putFile(file);
  }

  const page = await PageBlocks.getPageBlockById(file.pageId || "");
  const contentMarkdown = page.children
    .map((block) => convertToMarkdownRecursive(block))
    .join("\n");

  logInfo("Exporting page", pageTitle);

  await updateFile(file, contentMarkdown + "\n");

  return contentMarkdown;
}

export function convertToMarkdownRecursive(block: Block): string {
  let markdown = getContentMarkdown(block);

  if (block.children.length > 0) {
    const childrenMarkdown = block.children
      .map((child) => convertToMarkdownRecursive(child))
      .join("\n")
      .replace(/^/gm, "\t");

    markdown += "\n" + childrenMarkdown;
  }
  return markdown;
}

export function getContentMarkdown(block: Block): string {
  return (
    "- " +
    block.content
      .map((token) => {
        return token.toMarkdown();
      })
      .join("")
      .replaceAll(/\n/g, "\n  ")
      .trimEnd()
  );
}

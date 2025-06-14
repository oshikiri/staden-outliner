import { getPageBlockById } from "../sqlite";
import { getPageByTitle } from "../sqlite/pages";
import { Block } from "../markdown/block";
import { updateFile } from "../file";

export async function exportOnePageToMarkdown(
  pageTitle: string,
): Promise<string> {
  const file = await getPageByTitle(pageTitle);
  if (!file) {
    throw new Error(`Page with title "${pageTitle}" not found.`);
  }
  const page = await getPageBlockById(file.pageId || "");
  const contentMarkdown = page.children
    .map((block) => convertToMarkdownRecursive(block))
    .join("\n");

  console.log(`Exporting to ${pageTitle}:\n${contentMarkdown}`);

  await updateFile(file, contentMarkdown + "\n");

  return contentMarkdown;
}

export function convertToMarkdownRecursive(block: Block): string {
  let markdown = "- " + block.getContentMarkdown();

  if (block.children.length > 0) {
    const childrenMarkdown = block.children
      .map((child) => convertToMarkdownRecursive(child))
      .join("\n")
      .replace(/^/gm, "\t");

    markdown += "\n" + childrenMarkdown;
  }
  return markdown;
}

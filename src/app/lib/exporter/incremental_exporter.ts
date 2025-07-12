import { getPageBlockById, putFile } from "../sqlite";
import { getPageByTitle } from "../sqlite/pages";
import { Block } from "../markdown/block";
import { updateFile, fillPathToFile } from "../file";

export async function exportOnePageToMarkdown(
  pageTitle: string,
): Promise<string> {
  const file = await getPageByTitle(pageTitle);
  if (!file) {
    throw new Error(`Page with title "${pageTitle}" not found.`);
  }

  if (!file.path) {
    await fillPathToFile(file);
    await putFile(file);
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
      .trimEnd()
  );
}

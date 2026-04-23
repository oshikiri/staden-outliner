import { Block, parse } from "../markdown";
import { File } from "../file";

export async function loadMarkdown(file: File): Promise<Block> {
  if (!file.path) {
    throw new Error(`File path is not defined for file: ${file.title}`);
  }

  const markdown = await Bun.file(file.path).text();
  const pageBlock = parse(markdown);

  pageBlock.id = file.pageId;

  return pageBlock;
}

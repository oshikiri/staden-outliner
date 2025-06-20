import * as fs from "fs";

import { Block, parse } from "../markdown";
import { File } from "../file";

export function loadMarkdown(file: File): Block {
  if (!file.path) {
    throw new Error(`File path is not defined for file: ${file.title}`);
  }

  const markdown: string = fs.readFileSync(file.path || "", "utf8");
  const pageBlock = parse(markdown);

  pageBlock.id = file.pageId;
  pageBlock.pageId = file.pageId;

  return pageBlock;
}

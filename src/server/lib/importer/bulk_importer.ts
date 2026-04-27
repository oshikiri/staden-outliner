import { loadMarkdown } from ".";
import { Block, Token } from "@/shared/markdown";
import { getPageRefTitles } from "@/shared/markdown/utils";
import type { PageFileRecord } from "@/shared/file";
import { extractTitle, listAllFilePaths } from "@/server/lib/file";
import { getStadenRoot } from "@/server/lib/env/stadenRoot";
import { logInfo } from "@/shared/logger";

export class BulkImporter {
  stadenRoot: string;

  linksCached: [string, string][] = [];
  idToBlocks: Map<string, Block> = new Map();
  pageIdByBlockId: Map<string, string> = new Map();
  pageFiles: Map<string, PageFileRecord> = new Map();
  fileTitleToId: Map<string, string> = new Map();

  constructor() {
    this.stadenRoot = getStadenRoot();
  }

  /**
   * Fetch all files before reading blocks
   */
  async run() {
    // Get and create all files in the root directory
    const paths = await listAllFilePaths(this.stadenRoot);
    for (const path of paths) {
      const title = extractTitle(path);
      await this.putPageFile({ title, path });
    }

    // Import blocks from all files
    for (const file of this.pageFiles.values()) {
      if (!file.path) {
        continue;
      }
      const rootBlock = await loadMarkdown(file);
      await this.importBlockToDB(rootBlock, file.pageId || "", undefined);
    }

    logInfo("Import complete");

    return {
      blocks: Array.from(this.idToBlocks.values()),
      pageIdByBlockId: this.pageIdByBlockId,
      files: Array.from(this.pageFiles.values()),
      links: this.linksCached,
    };
  }

  getPageIdOrCreate(pageTitle: string): string {
    const targetFile = this.createOrGetFileByTitle(pageTitle);
    const targetPageId = targetFile?.pageId;
    if (!targetPageId) {
      throw new Error(`No page found with title ${pageTitle}`);
    }

    return targetPageId;
  }

  private createOrGetFileByTitle(title: string): PageFileRecord | undefined {
    const pageIdByTitle = this.fileTitleToId.get(title);
    const file = this.pageFiles.get(pageIdByTitle || "");
    if (file) {
      return file;
    }

    const fileCreated = this.putPageFile({ title });
    const pageId = fileCreated?.pageId || "";
    const block = new Block([], 1, []).withId(pageId);
    this.idToBlocks.set(pageId, block);
    this.pageIdByBlockId.set(pageId, pageId);

    return fileCreated;
  }
  private putPageFile(file: PageFileRecord): PageFileRecord | undefined {
    file.pageId = file.pageId || crypto.randomUUID();

    this.pageFiles.set(file.pageId, file);
    this.fileTitleToId.set(file.title, file.pageId);

    return file;
  }

  private importBlockToDB(
    block: Block,
    pageId: string,
    parent: Block | undefined,
  ): void {
    block.id = block.id || crypto.randomUUID();
    block.parent = parent;
    block.setPropertiesFromContent();

    this.idToBlocks.set(block.id, block);
    this.pageIdByBlockId.set(block.id, pageId);
    for (const target of this.extractOutLinks(block.content)) {
      this.linksCached.push([block.id, target]);
    }

    for (const child of block.children) {
      this.importBlockToDB(child, pageId, block);
    }
  }

  private extractOutLinks(tokens: Token[]): string[] {
    const targets: string[] = [];
    for (const title of getPageRefTitles(tokens)) {
      const toBlockId = this.getPageIdOrCreate(title);
      targets.push(toBlockId);
    }
    return targets;
  }
}

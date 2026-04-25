import { loadMarkdown } from ".";
import { Block, Token } from "@/shared/markdown";
import { getPageRefTitles } from "@/shared/markdown/utils";
import type { FileRecord } from "@/shared/file";
import { extractTitle, listAllFilePaths } from "@/server/lib/file";
import { getStadenRoot } from "@/server/lib/env/stadenRoot";
import { logInfo } from "@/shared/logger";

export class BulkImporter {
  stadenRoot: string;

  linksCached: [string, string][] = [];
  idToBlocks: Map<string, Block> = new Map();
  pageIdByBlockId: Map<string, string> = new Map();
  files: Map<string, FileRecord> = new Map();
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
      await this.putFile({ title, path });
    }

    // Import blocks from all files
    for (const file of this.files.values()) {
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
      files: Array.from(this.files.values()),
      links: this.linksCached,
    };
  }

  async getPageIdOrCreate(pageTitle: string): Promise<string> {
    const targetFile = await this.createOrGetFileByTitle(pageTitle);
    const targetPageId = targetFile?.pageId;
    if (!targetPageId) {
      throw new Error(`No page found with title ${pageTitle}`);
    }

    return targetPageId;
  }

  private async createOrGetFileByTitle(
    title: string,
  ): Promise<FileRecord | undefined> {
    const pageIdByTitle = this.fileTitleToId.get(title);
    const file = this.files.get(pageIdByTitle || "");
    if (file) {
      return file;
    }

    const fileCreated = await this.putFile({ title });
    const pageId = fileCreated?.pageId || "";
    const block = new Block([], 1, []).withId(pageId);
    this.idToBlocks.set(pageId, block);
    this.pageIdByBlockId.set(pageId, pageId);

    return fileCreated;
  }
  private async putFile(file: FileRecord): Promise<FileRecord | undefined> {
    file.pageId = file.pageId || crypto.randomUUID();

    this.files.set(file.pageId, file);
    this.fileTitleToId.set(file.title, file.pageId);

    return Promise.resolve(file);
  }

  private async importBlockToDB(
    block: Block,
    pageId: string,
    parent: Block | undefined,
  ): Promise<void> {
    block.id = block.id || crypto.randomUUID();
    block.parent = parent;
    block.setPropertiesFromContent();

    this.idToBlocks.set(block.id, block);
    this.pageIdByBlockId.set(block.id, pageId);
    for (const target of await this.extractOutLinks(block.content)) {
      this.linksCached.push([block.id, target]);
    }

    const childrenPromised = block.children.map(async (child) => {
      await this.importBlockToDB(child, pageId, block);
      return;
    });
    await Promise.all(childrenPromised);
  }

  private async extractOutLinks(tokens: Token[]): Promise<string[]> {
    const targets: string[] = [];
    for (const title of getPageRefTitles(tokens)) {
      const toBlockId = await this.getPageIdOrCreate(title);
      targets.push(toBlockId);
    }
    return targets;
  }
}

import { randomUUID } from "crypto";

import { loadMarkdown } from ".";
import { Block, Token } from "../markdown";
import { getPageRefTitles } from "../markdown/utils";
import { File, extractTitle, listAllFilePaths } from "../file";

export class BulkImporter {
  stadenRoot: string;

  linksCached: [string, string][] = [];
  idToBlocks: Map<string, Block> = new Map();
  files: Map<string, File> = new Map();
  fileTitleToId: Map<string, string> = new Map();

  constructor() {
    this.stadenRoot = process.env.STADEN_ROOT || "";
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
      const rootBlock = loadMarkdown(file);
      await this.importBlockToDB(rootBlock);
    }

    console.log("Import complete");

    return {
      blocks: Array.from(this.idToBlocks.values()),
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
  ): Promise<File | undefined> {
    const pageIdByTitle = this.fileTitleToId.get(title);
    const file = this.files.get(pageIdByTitle || "");
    if (file) {
      return file;
    }

    const fileCreated = await this.putFile({ title });
    const pageId = fileCreated?.pageId || "";
    const block = new Block([], 1, []).withId(pageId);
    this.idToBlocks.set(pageId, block);

    return fileCreated;
  }
  private async putFile(file: File): Promise<File | undefined> {
    file.pageId = file.pageId || randomUUID();

    this.files.set(file.pageId, file);
    this.fileTitleToId.set(file.title, file.pageId);

    return Promise.resolve(file);
  }

  private async importBlockToDB(block: Block): Promise<void> {
    block.id = block.id || randomUUID();
    block.setPropertiesFromContent();

    this.idToBlocks.set(block.id, block);
    for (const target of await this.extractOutLinks(block.content)) {
      this.linksCached.push([block.id, target]);
    }

    const childrenPromised = block.children.map(async (child) => {
      child.pageId = block.pageId;
      child.parentId = block.id;
      await this.importBlockToDB(child);
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

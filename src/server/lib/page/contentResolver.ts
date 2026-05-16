import path from "node:path";

import { Block } from "@/shared/markdown";
import {
  BlockRef,
  CodeBlock,
  Command,
  CommandQuery,
  Heading,
  Image,
  PropertyPair,
  Quote,
  Token,
} from "@/shared/markdown/token";
import { getStadenRoot } from "@/server/lib/env/stadenRoot";
import {
  ensureRegexCaptureExtensionLoaded,
  getReadonlyDb,
  logSqliteQuery,
} from "../sqlite/db";
import * as SqliteBlocks from "../sqlite/blocks";
import type { SQLQueryBindings } from "bun:sqlite";
import { logWarn } from "@/shared/logger";
import type { CommandQueryRow } from "@/shared/markdown/token";

type ResolvePageContentOptions = {
  pageFilePath?: string;
  stadenRoot?: string;
};

export async function resolvePageContent(
  page: Block,
  options: ResolvePageContentOptions = {},
): Promise<Block> {
  resolveImagePaths(page, options);
  await resolveBlockRefs(page);
  await resolveCommandTokens(page);
  return page;
}

function resolveImagePaths(
  page: Block,
  options: ResolvePageContentOptions,
): void {
  if (!options.pageFilePath) {
    return;
  }

  const stadenRoot = path.resolve(options.stadenRoot ?? getStadenRoot());
  const pageDirectory = path.dirname(path.resolve(options.pageFilePath));

  for (const block of page.flatten()) {
    resolveImagePathsInTokens(block.content, pageDirectory, stadenRoot);
  }
}

function resolveImagePathsInTokens(
  tokens: Token[],
  pageDirectory: string,
  stadenRoot: string,
): void {
  for (const token of tokens) {
    if (token instanceof Image) {
      const resolvedPath = resolveImagePath(
        token.src,
        pageDirectory,
        stadenRoot,
      );
      if (resolvedPath) {
        token.src = resolvedPath;
      }
      continue;
    }

    if (token instanceof Heading) {
      resolveImagePathsInTokens(token.content, pageDirectory, stadenRoot);
      continue;
    }

    if (token instanceof Quote) {
      resolveImagePathsInTokens(token.tokens, pageDirectory, stadenRoot);
      continue;
    }

    if (token instanceof PropertyPair) {
      resolveImagePathsInTokens([token.key], pageDirectory, stadenRoot);
      resolveImagePathsInTokens(token.value, pageDirectory, stadenRoot);
    }
  }
}

function resolveImagePath(
  src: string,
  pageDirectory: string,
  stadenRoot: string,
): string | undefined {
  if (!isLocalRelativePath(src)) {
    return undefined;
  }

  const imagePath = path.resolve(pageDirectory, src);
  const relative = path.relative(stadenRoot, imagePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    logWarn("Ignoring image path outside STADEN_ROOT", { src, imagePath });
    return undefined;
  }

  return relative.split(path.sep).join(path.posix.sep);
}

function isLocalRelativePath(src: string): boolean {
  if (path.isAbsolute(src) || src.startsWith("#")) {
    return false;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(src)) {
    return false;
  }
  return true;
}

async function resolveBlockRefs(page: Block): Promise<void> {
  for (const content of page.content) {
    if (content instanceof BlockRef) {
      const block = await SqliteBlocks.getBlockById(content.id);
      content.resolvedContent = block.content;
    }
  }

  for (const child of page.children) {
    await resolveBlockRefs(child);
  }
}

async function resolveCommandTokens(page: Block): Promise<void> {
  for (let i = 0; i < page.content.length; i++) {
    const content = page.content[i];
    if (content instanceof Command) {
      await resolveCommand(content);
      continue;
    }

    if (content instanceof CommandQuery) {
      try {
        page.content[i] = await resolveCommandQuery(content, page.id || "");
      } catch (error) {
        logWarn("Failed to resolve CommandQuery", {
          blockId: page.id || "",
          error,
        });
      }
    }
  }

  for (const child of page.children) {
    await resolveCommandTokens(child);
  }
}

async function resolveCommand(command: Command): Promise<void> {
  if (command.name !== "embed") {
    return;
  }

  const id = command.args.replace("((", "").replace("))", "");
  const block = await SqliteBlocks.getBlockById(id);
  command.resolvedContent = block.content || [];
}

async function resolveCommandQuery(
  command: CommandQuery,
  blockId: string,
): Promise<CommandQuery> {
  const block = await SqliteBlocks.getBlockById(blockId);
  if (!block) {
    return command;
  }

  const codeBlocks = readCommandQueryCodeBlocks(block);
  const queryCode = codeBlocks[0];
  if (!(queryCode instanceof CodeBlock)) {
    return command;
  }

  if (command.observablePlot && isChartSourceCodeBlock(queryCode)) {
    command.chartSource = queryCode.textContent;
    return command;
  }

  const query = queryCode.textContent;
  if (!isReadonlyQuery(query)) {
    throw new Error("CommandQuery only allows read-only SELECT queries");
  }
  if (isRegexCaptureQuery(query)) {
    ensureRegexCaptureExtensionLoaded();
  }
  const queryExecutionStart = Date.now();
  logSqliteQuery(query, []);
  const rows = getReadonlyDb()
    .query<CommandQueryRow, SQLQueryBindings[]>(query)
    .all();
  command.queryExecutionMilliseconds = Date.now() - queryExecutionStart;
  if (rows) {
    command.resolvedBlocks = rows;
  }

  const chartCode = codeBlocks[1];
  if (chartCode && isChartSourceCodeBlock(chartCode)) {
    command.chartSource = chartCode.textContent;
  }

  return command;
}

function readCommandQueryCodeBlocks(block: Block): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];
  const commandQueryIndex = block.content.findIndex(
    (token) => token instanceof CommandQuery,
  );
  if (commandQueryIndex >= 0) {
    for (const token of block.content.slice(commandQueryIndex + 1)) {
      if (token instanceof CodeBlock) {
        codeBlocks.push(token);
      }
    }
  }

  for (const child of block.children) {
    for (const token of child.content) {
      if (token instanceof CodeBlock) {
        codeBlocks.push(token);
      }
    }
  }
  return codeBlocks;
}

function isChartSourceCodeBlock(token: CodeBlock): boolean {
  return /^(js|javascript)$/i.test(token.lang);
}

function isReadonlyQuery(query: string): boolean {
  return /^(with|select|explain)\b/i.test(query.trim());
}

function isRegexCaptureQuery(query: string): boolean {
  return /\bregex_capture\s*\(/i.test(query);
}

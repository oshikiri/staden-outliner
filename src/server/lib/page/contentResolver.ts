import { Block } from "@/shared/markdown";
import {
  BlockRef,
  CodeBlock,
  Command,
  CommandQuery,
} from "@/shared/markdown/token";
import { getReadonlyDb, logSqliteQuery } from "../sqlite/db";
import * as SqliteBlocks from "../sqlite/blocks";
import type { SQLQueryBindings } from "bun:sqlite";
import { logWarn } from "@/shared/logger";
import type { CommandQueryRow } from "@/shared/markdown/token";

export async function resolvePageContent(page: Block): Promise<Block> {
  await resolveBlockRefs(page);
  await resolveCommandTokens(page);
  return page;
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

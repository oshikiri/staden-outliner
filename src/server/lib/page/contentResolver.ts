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
import { logDebug, logWarn } from "@/shared/logger";
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

  const code: unknown = block.children[0]?.content[0];
  if (!(code instanceof CodeBlock)) {
    return command;
  }

  const query = code.textContent;
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

  const vlJsonCodeBlock = block.children[1]?.content?.[0];
  if (vlJsonCodeBlock instanceof CodeBlock && vlJsonCodeBlock.lang === "json") {
    command.vlJsonStr = vlJsonCodeBlock.textContent;
    command.resolvedDataForVlJson = rows;
    logDebug("Resolved CommandQuery JSON", {
      blockId,
      rowCount: rows.length,
    });
  }

  return command;
}

function isReadonlyQuery(query: string): boolean {
  return /^(with|select|explain)\b/i.test(query.trim());
}

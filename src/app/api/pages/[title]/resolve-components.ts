import { Block } from "../../../lib/markdown";
import {
  BlockRef,
  CodeBlock,
  Command,
  CommandQuery,
} from "../../../lib/markdown/token";
import {
  query as sqliteQuery,
  getBlockById as getBlockByIdDb,
} from "../../../lib/sqlite";

export async function resolveBlockRef(page: Block) {
  for (const i in page.content) {
    const content = page.content[i];
    if (content instanceof BlockRef) {
      const block = await getBlockByIdDb(content.id);
      content.resolvedContent = block.content;
    }
  }

  for (const child of page.children) {
    await resolveBlockRef(child);
  }
}

export async function resolveAllCommandTokens(page: Block): Promise<Block> {
  for (const i in page.content) {
    let content = page.content[i];
    if (content instanceof Command) {
      content = await resolveCommand(content);
    } else if (content instanceof CommandQuery) {
      // @owner Empty catch swallows runtime errors, making debugging difficult. Log or propagate the error.
      try {
        page.content[i] = await resolveCommandQuery(content, page.id || "");
      } catch {}
    }
  }

  for (const child of page.children) {
    await resolveAllCommandTokens(child);
  }

  return page;
}

async function resolveCommand(command: Command): Promise<Command> {
  if (command.name === "embed") {
    const id = command.args.replace("((", "").replace("))", "");
    const block = await getBlockByIdDb(id);
    command.resolvedContent = block.content || [];
  }
  return command;
}

async function resolveCommandQuery(
  command: CommandQuery,
  blockId: string,
): Promise<CommandQuery> {
  const block = await getBlockByIdDb(blockId);
  if (!block) {
    return command;
  }
  // @owner Assumes the first child is a CodeBlock containing the query;
  // add guards to avoid runtime errors when structure differs.
  const code: unknown = block.children[0].content[0];
  if (!(code instanceof CodeBlock)) {
    return command;
  }

  const query: string = code.textContent;
  const queryExecutionStart = Date.now();
  const rows = await sqliteQuery(query);
  command.queryExecutionMilliseconds = Date.now() - queryExecutionStart;
  if (rows) {
    command.resolvedBlocks = rows;
  }

  // @owner Also assumes the second child holds Vega-Lite JSON; validate before use.
  const vlJsonCodeBlock = block.children[1]?.content?.[0];
  if (vlJsonCodeBlock instanceof CodeBlock && vlJsonCodeBlock.lang === "json") {
    const vlJsonStr = vlJsonCodeBlock.textContent;
    command.vlJsonStr = vlJsonStr;
    command.resolvedDataForVlJson = rows;
    console.log({ vlJsonStr, rows });
  }

  return command;
}

export function fillContentMarkdown(page: Block): Block {
  page.contentMarkdown = page.content
    .map((token) => {
      return token.toMarkdown();
    })
    .join("")
    .trimEnd();
  page.children.forEach((child) => {
    fillContentMarkdown(child);
  });

  return page;
}

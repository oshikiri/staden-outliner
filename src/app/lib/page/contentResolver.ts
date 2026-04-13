import { Block } from "@/app/lib/markdown";
import {
  BlockRef,
  CodeBlock,
  Command,
  CommandQuery,
} from "@/app/lib/markdown/token";
import {
  getBlockById as getBlockByIdDb,
  query as sqliteQuery,
} from "@/app/lib/sqlite";

export async function resolvePageContent(page: Block): Promise<Block> {
  await resolveBlockRefs(page);
  await resolveCommandTokens(page);
  return fillContentMarkdown(page);
}

async function resolveBlockRefs(page: Block): Promise<void> {
  for (const i in page.content) {
    const content = page.content[i];
    if (content instanceof BlockRef) {
      const block = await getBlockByIdDb(content.id);
      content.resolvedContent = block.content;
    }
  }

  for (const child of page.children) {
    await resolveBlockRefs(child);
  }
}

async function resolveCommandTokens(page: Block): Promise<void> {
  for (const i in page.content) {
    const content = page.content[i];
    if (content instanceof Command) {
      await resolveCommand(content);
      continue;
    }

    if (content instanceof CommandQuery) {
      try {
        page.content[i] = await resolveCommandQuery(content, page.id || "");
      } catch {}
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
  const block = await getBlockByIdDb(id);
  command.resolvedContent = block.content || [];
}

async function resolveCommandQuery(
  command: CommandQuery,
  blockId: string,
): Promise<CommandQuery> {
  const block = await getBlockByIdDb(blockId);
  if (!block) {
    return command;
  }

  const code: unknown = block.children[0]?.content[0];
  if (!(code instanceof CodeBlock)) {
    return command;
  }

  const query = code.textContent;
  const queryExecutionStart = Date.now();
  const rows = await sqliteQuery(query);
  command.queryExecutionMilliseconds = Date.now() - queryExecutionStart;
  if (rows) {
    command.resolvedBlocks = rows;
  }

  const vlJsonCodeBlock = block.children[1]?.content?.[0];
  if (vlJsonCodeBlock instanceof CodeBlock && vlJsonCodeBlock.lang === "json") {
    command.vlJsonStr = vlJsonCodeBlock.textContent;
    command.resolvedDataForVlJson = rows;
    console.log({ vlJsonStr: command.vlJsonStr, rows });
  }

  return command;
}

function fillContentMarkdown(page: Block): Block {
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

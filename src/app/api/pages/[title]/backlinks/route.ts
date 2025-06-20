import { getSourceEdges, getCurrentPage } from "@/app/lib/sqlite";
import { Block } from "@/app/lib/markdown/block";

type Props = {
  params: Promise<{
    title: string;
  }>;
};

export async function GET(_req: Request, props: Props) {
  const { title } = await props.params;

  const sourceIds = await getSourceEdges(title || "");
  const sourceBlocks: Block[] = (await Promise.all(
    sourceIds.map(async (sourceId) => {
      return resolveBacklink(sourceId);
    }),
  )) as Block[];

  return new Response(JSON.stringify(sourceBlocks), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function resolveBacklink(sourceId: string): Promise<Block> {
  const pageBlock = await getCurrentPage(sourceId);
  const sourceBlock = pageBlock.getBlockById(sourceId);

  let currentBlock: Block | undefined = sourceBlock?.parent || undefined;
  let ancestors = currentBlock?.getContentMarkdown().split("\n")[0];
  currentBlock = currentBlock?.parent;
  while (currentBlock && currentBlock != pageBlock) {
    ancestors =
      currentBlock.getContentMarkdown().split("\n")[0] + " > " + ancestors;
    currentBlock = currentBlock.parent;
  }
  if (!sourceBlock?.properties) {
    sourceBlock!.properties = [];
  }
  sourceBlock?.properties?.push(["ancestors", ancestors]);

  return sourceBlock!;
}

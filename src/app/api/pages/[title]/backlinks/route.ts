import { getSourceLinks, getCurrentPage } from "@/app/lib/sqlite";
import { Block } from "@/app/lib/markdown/block";
import { toBlockDto } from "@/app/lib/markdown/blockDto";

type Props = {
  params: Promise<{
    title: string;
  }>;
};

export async function GET(_req: Request, props: Props) {
  const { title } = await props.params;

  const sourceIds = await getSourceLinks(title || "");
  const sourceBlocks = await Promise.all(
    sourceIds.map(async (sourceId) => {
      return resolveBacklink(sourceId);
    }),
  );

  return new Response(
    JSON.stringify(
      sourceBlocks.map(({ block, pageId }) => toBlockDto(block, { pageId })),
    ),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

async function resolveBacklink(
  sourceId: string,
): Promise<{ block: Block; pageId: string }> {
  const pageBlock = await getCurrentPage(sourceId);
  if (!pageBlock.id) {
    throw new Error(`Page block id is missing for source: ${sourceId}`);
  }
  const sourceBlock = pageBlock.getBlockById(sourceId);

  let currentBlock: Block | undefined = sourceBlock?.parent || undefined;
  let ancestors = currentBlock?.getContentMarkdownHead();
  currentBlock = currentBlock?.parent;
  while (currentBlock && currentBlock != pageBlock) {
    ancestors = currentBlock.getContentMarkdownHead() + " > " + ancestors;
    currentBlock = currentBlock.parent;
  }
  if (!sourceBlock?.properties) {
    sourceBlock!.properties = [];
  }
  sourceBlock?.properties?.push(["ancestors", ancestors]);

  return { block: sourceBlock!, pageId: pageBlock.id };
}

import { createToken } from "./token";
import { Block } from "./block";
import type { BlockDto, BlockPropertyDto } from "./blockDtoTypes";

type BlockDtoContext = {
  pageId: string;
  parentId?: string;
};

export function toPageDto(root: Block): BlockDto {
  if (!root.id) {
    throw new Error("Root block id is required");
  }
  return toBlockDto(root, { pageId: root.id });
}

export function toBlockDto(block: Block, context: BlockDtoContext): BlockDto {
  const { pageId, parentId = block.parent?.id } = context;
  return {
    id: block.id,
    parentId,
    pageId,
    properties: cloneProperties(block.properties),
    depth: block.depth,
    content: block.content.map(toTokenDto),
    children: block.children.map((child) =>
      toBlockDto(child, {
        pageId,
        parentId: block.id,
      }),
    ),
  };
}

export function fromBlockDto(dto: BlockDto): Block {
  const block = new Block(
    dto.content.map((token) => createToken(token)),
    dto.depth,
    dto.children.map((child) => fromBlockDto(child)),
  );
  block.id = dto.id ?? crypto.randomUUID();
  block.properties = cloneProperties(dto.properties);
  block.setPropertiesFromContent();
  block.children.forEach((child) => {
    child.parent = block;
  });
  return block;
}

function cloneProperties(
  properties?: BlockPropertyDto[],
): BlockPropertyDto[] | undefined {
  return properties?.map(([key, value]) => [key, value]);
}

function toTokenDto(token: object) {
  return JSON.parse(JSON.stringify(token)) as Record<string, unknown>;
}

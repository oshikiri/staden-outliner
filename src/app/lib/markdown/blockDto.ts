import { Block } from "./block";
import { createToken, TokenType } from "./token";

export type BlockPropertyDto = [string, unknown];

export type TokenDto = {
  type: TokenType;
  [key: string]: unknown;
};

/**
 * Transport shape for page and block payloads at API boundaries.
 * This DTO still carries temporary fields that will be split further later.
 */
export type BlockDto = {
  id?: string;
  parentId?: string;
  pageId?: string;
  properties?: BlockPropertyDto[];
  depth: number;
  content: TokenDto[];
  children: BlockDto[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBlockPropertyDto(value: unknown): value is BlockPropertyDto {
  return (
    Array.isArray(value) && value.length === 2 && typeof value[0] === "string"
  );
}

function isTokenDto(value: unknown): value is TokenDto {
  return isRecord(value) && typeof value.type === "number";
}

export function isBlockDto(value: unknown): value is BlockDto {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.depth !== "number") {
    return false;
  }
  if (!Array.isArray(value.content) || !value.content.every(isTokenDto)) {
    return false;
  }
  if (!Array.isArray(value.children) || !value.children.every(isBlockDto)) {
    return false;
  }
  if (value.id !== undefined && typeof value.id !== "string") {
    return false;
  }
  if (value.parentId !== undefined && typeof value.parentId !== "string") {
    return false;
  }
  if (value.pageId !== undefined && typeof value.pageId !== "string") {
    return false;
  }
  if (
    value.properties !== undefined &&
    (!Array.isArray(value.properties) ||
      !value.properties.every(isBlockPropertyDto))
  ) {
    return false;
  }
  return true;
}

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
  block.id = dto.id;
  block.properties = cloneProperties(dto.properties);
  block.setPropertiesFromContent();
  block.children.forEach((child) => {
    child.parent = block;
  });
  return block;
}

function cloneProperties(
  properties?: BlockPropertyDto[] | unknown[][],
): BlockPropertyDto[] | undefined {
  return properties?.map((property) => {
    return [property[0] as string, property[1]];
  });
}

function toTokenDto(token: object): TokenDto {
  return JSON.parse(JSON.stringify(token)) as TokenDto;
}

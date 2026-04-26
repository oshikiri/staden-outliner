import { Block } from "./block";
import { createToken, isTokenType, TokenType } from "./token";

export type BlockPropertyDto = [string, unknown];

type TokenDto = {
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

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isOptionalTokenArray(value: unknown): value is unknown[] | undefined {
  return value === undefined || Array.isArray(value);
}

function isOptionalRecordArray(
  value: unknown,
): value is Record<string, unknown>[] | undefined {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.every((item) => typeof item === "object" && item !== null))
  );
}

function isImageTokenDto(value: Record<string, unknown>): boolean {
  return (
    typeof value.src === "string" &&
    typeof value.alt === "string" &&
    isOptionalString(value.width) &&
    isOptionalString(value.height)
  );
}

function isHeadingTokenDto(value: Record<string, unknown>): boolean {
  return (
    typeof value.level === "number" &&
    Array.isArray(value.content) &&
    value.content.every(isTokenDto)
  );
}

function isTextLikeTokenDto(value: Record<string, unknown>): boolean {
  return typeof value.textContent === "string";
}

function isTitleTokenDto(value: Record<string, unknown>): boolean {
  return typeof value.title === "string";
}

function isQuoteTokenDto(value: Record<string, unknown>): boolean {
  return Array.isArray(value.tokens) && value.tokens.every(isTokenDto);
}

function isPropertyPairTokenDto(value: Record<string, unknown>): boolean {
  return (
    isTokenDto(value.key) &&
    Array.isArray(value.value) &&
    value.value.every(isTokenDto)
  );
}

function isBlockRefTokenDto(value: Record<string, unknown>): boolean {
  return (
    typeof value.id === "string" && isOptionalTokenArray(value.resolvedContent)
  );
}

function isCommandQueryTokenDto(value: Record<string, unknown>): boolean {
  return (
    typeof value.query === "string" &&
    isOptionalRecordArray(value.resolvedBlocks) &&
    isOptionalString(value.vlJsonStr) &&
    isOptionalTokenArray(value.resolvedDataForVlJson) &&
    (value.queryExecutionMilliseconds === undefined ||
      typeof value.queryExecutionMilliseconds === "number")
  );
}

function isTokenDto(value: unknown): value is TokenDto {
  if (!isRecord(value) || !isTokenType(value.type)) {
    return false;
  }

  switch (value.type) {
    case TokenType.NewLine:
    case TokenType.PropertyPairSeparator:
      return true;
    case TokenType.Image:
      return isImageTokenDto(value);
    case TokenType.ListStart:
      return typeof value.depth === "number";
    case TokenType.Text:
    case TokenType.InlineCode:
      return isTextLikeTokenDto(value);
    case TokenType.PageRef:
      return isTitleTokenDto(value);
    case TokenType.Link:
      return typeof value.url === "string" && isTitleTokenDto(value);
    case TokenType.Heading:
      return isHeadingTokenDto(value);
    case TokenType.Quote:
      return isQuoteTokenDto(value);
    case TokenType.CodeBlock:
      return (
        typeof value.textContent === "string" && typeof value.lang === "string"
      );
    case TokenType.PropertyPair:
      return isPropertyPairTokenDto(value);
    case TokenType.BlockRef:
      return isBlockRefTokenDto(value);
    case TokenType.Command:
      return typeof value.name === "string" && typeof value.args === "string";
    case TokenType.CommandQuery:
      return isCommandQueryTokenDto(value);
    case TokenType.Marker:
      return typeof value.status === "string";
  }

  return false;
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
  properties?: BlockPropertyDto[],
): BlockPropertyDto[] | undefined {
  return properties?.map(([key, value]) => [key, value]);
}

function toTokenDto(token: object): TokenDto {
  return JSON.parse(JSON.stringify(token)) as TokenDto;
}

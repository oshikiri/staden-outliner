import { Block } from "../markdown";
import { createToken } from "../markdown/token";

export type BlockRecord = {
  id: string;
  page_id: string;
  parent_id: string | null;
  depth: number;
  order_index?: number;
  content: string;
  page_title?: string;
};

export type BlockInsertOptions = {
  defaultPageId?: string;
  pageIdByBlockId?: Map<string, string>;
};

export function createPageBlockFromRows(rows: BlockRecord[]): Block {
  if (rows.length === 0) {
    throw new Error("No blocks found");
  }

  const idToRows = new Map<string, BlockRecord>();
  const childrenMap = new Map<
    string,
    Array<{ id: string; orderIndex: number }>
  >();

  for (const row of rows) {
    idToRows.set(row.id, row);
    if (!childrenMap.has(row.id)) {
      childrenMap.set(row.id, []);
    }

    if (row.parent_id) {
      if (!childrenMap.has(row.parent_id)) {
        childrenMap.set(row.parent_id, []);
      }
      childrenMap.get(row.parent_id)!.push({
        id: row.id,
        orderIndex: row.order_index || 0,
      });
    }
  }

  for (const children of childrenMap.values()) {
    children.sort((left, right) => left.orderIndex - right.orderIndex);
  }

  const pageId = rows[0].page_id;
  const rootRow = rows.find((row) => !row.parent_id);
  if (!rootRow) {
    throw new Error(`Root block not found for page: ${pageId}`);
  }

  return createBlockFromRows(rootRow.id, idToRows, childrenMap);
}

export function toBlockInsertRecord(
  block: Block,
  options: BlockInsertOptions,
): unknown[] | null {
  if (!block.id) {
    return null;
  }

  const pageId =
    options.pageIdByBlockId?.get(block.id) || options.defaultPageId;
  if (!pageId) {
    throw new Error(`Missing pageId for block: ${block.id}`);
  }

  return [
    block.id,
    pageId,
    block.parent?.id || null,
    block.depth,
    getOrderIndex(block),
    JSON.stringify(block.content),
    getContentMarkdown(block),
    JSON.stringify(createPropertyMap(block.properties || [])),
  ];
}

function createBlockFromRows(
  currentId: string,
  idToRows: Map<string, BlockRecord>,
  childrenMap: Map<string, Array<{ id: string; orderIndex: number }>>,
): Block {
  const row = idToRows.get(currentId);
  if (!row) {
    throw new Error(`Block not found for id: ${currentId}`);
  }

  const childIds = (childrenMap.get(currentId) || []).map((child) => child.id);
  const childBlocks = childIds.map((childId) => {
    return createBlockFromRows(childId, idToRows, childrenMap);
  });

  const content = JSON.parse(row.content).map(createToken);
  const block = new Block(content, row.depth, childBlocks);
  block.id = row.id;
  block.setProperty("title", row.page_title);
  block.children.forEach((child) => {
    child.parent = block;
  });

  return block;
}

function getOrderIndex(block: Block): number {
  if (!block.parent) {
    return 0;
  }
  return block.parent.children.indexOf(block);
}

function getContentMarkdown(block: Block): string {
  return block.content
    .map((token) => {
      return token.toMarkdown();
    })
    .join("")
    .trimEnd();
}

function createPropertyMap(properties: unknown[][]): object {
  const map: any = {};
  properties.forEach((pair: unknown[]) => {
    if (pair.length === 2) {
      const key = pair[0] as string;
      const value = pair[1] as string;
      map[key] = value;
    }
  });
  return map;
}

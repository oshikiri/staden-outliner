import { Block } from "../markdown";
import { chunk } from "../lodash";
import { db, query } from ".";
import { createToken } from "../markdown/token";

export async function initializeBlocks() {
  db.exec("DROP TABLE IF EXISTS blocks");
  db.exec(
    `CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      page_id TEXT,
      parent_id TEXT,
      depth INTEGER,
      order_index INTEGER DEFAULT 0,
      content TEXT,
      content_markdown TEXT,
      properties TEXT
    )`,
  );
}

export async function getPageBlockById(pageId: string): Promise<Block> {
  const blocks = await query(
    `
    SELECT blocks.*, pages.title AS page_title
    FROM blocks
    LEFT JOIN pages ON pages.id = blocks.page_id
    WHERE pages.id = ?;
  `,
    [pageId],
  );

  const rootBlock = createPageFromBlocks(blocks);
  return rootBlock;
}

export async function getPageBlockByTitle(
  title: string,
): Promise<Block | undefined> {
  const blocks = await query(
    `
    SELECT blocks.*, pages.title AS page_title
    FROM blocks
    LEFT JOIN pages ON pages.id = blocks.page_id
    WHERE pages.title = ?;
  `,
    [title],
  );

  // RV: Use strict equality when comparing numeric lengths.
  if (blocks.length == 0) {
    return undefined;
  }

  const rootBlock = createPageFromBlocks(blocks);
  return rootBlock;
}

/**
 * Get block by id with all its children
 */
export async function getBlockById(id: string): Promise<Block> {
  const rootBlock = await getCurrentPage(id);
  return rootBlock.getBlockById(id)!;
}

export async function getCurrentPage(childId: string): Promise<Block> {
  const blocks = await query(
    `
    SELECT blocks.*, pages.title AS page_title
    FROM blocks
    LEFT JOIN pages ON pages.id = blocks.page_id
    WHERE blocks.page_id = (SELECT page_id FROM blocks WHERE id = ?);
  `,
    [childId],
  );
    // RV: Use strict equality when checking array length.
    if (blocks.length == 0) {
      throw new Error(`Block not found for pageId: ${childId}`);
    }
  const rootBlock = createPageFromBlocks(blocks);
  return rootBlock;
}

// RV: Use a typed interface for database rows instead of any[].
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createPageFromBlocks(blocks: any[]): Block {
  if (blocks.length == 0) {
    throw new Error("No blocks found");
  }

  const idToBlocks = new Map<string, Block>();
  const childrenMap = new Map<
    string,
    Array<{ id: string; order_index: number }>
  >();

  for (const block of blocks) {
    idToBlocks.set(block.id, block);
    if (!childrenMap.has(block.id)) {
      childrenMap.set(block.id, []);
    }

    if (block.parent_id) {
      if (!childrenMap.has(block.parent_id)) {
        childrenMap.set(block.parent_id, []);
      }
      childrenMap.get(block.parent_id)!.push({
        id: block.id,
        order_index: block.order_index || 0,
      });
    }
  }

  for (const [_parentId, children] of childrenMap.entries()) {
    children.sort((a, b) => a.order_index - b.order_index);
  }

  const pageId = blocks[0].page_id;
  const rootBlockData = blocks.find((b) => !b.parent_id);

  if (!rootBlockData) {
    throw new Error(`Root block not found for page: ${pageId}`);
  }

  const rootBlock = createBlockFromDbWithChildren(
    rootBlockData.id,
    idToBlocks,
    childrenMap,
  );
  return rootBlock;
}

function createBlockFromDbWithChildren(
  currentId: string,
  // RV: Map values typed as any hide block structure; define a specific row type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  idToBlocks: Map<string, any>,
  childrenMap: Map<string, Array<{ id: string; order_index: number }>>,
): Block {
  const b = idToBlocks.get(currentId);
  if (!b) {
    throw new Error(`Block not found for id: ${currentId}`);
  }

  const childData = childrenMap.get(currentId) || [];
  const childIds = childData.map((child) => child.id);

  const childBlocks = childIds.map((childId: string) => {
    return createBlockFromDbWithChildren(childId, idToBlocks, childrenMap);
  });

  const content = JSON.parse(b.content).map(createToken);
  const block = new Block(content, b.depth, childBlocks);
  block.id = b.id;
  block.pageId = b.page_id;
  block.setProperty("title", b.page_title);
  block.children.forEach((child) => {
    child.parent = block;
  });

  return block;
}

export async function batchInsertBlocks(blocks: Block[], BATCH_SIZE: number) {
  let i = 0;
  for (const batch of chunk(Array.from(blocks), BATCH_SIZE)) {
    console.log(
      `Importing batch ${i + 1} of ${Math.ceil(blocks.length / BATCH_SIZE)}`,
    );
    i++;
    await batchInsertBlock(batch);
  }
}

async function batchInsertBlock(blocks: Block[]) {
  const insert = db.prepare(`
    REPLACE INTO blocks
      (id, page_id, parent_id, depth, order_index, content, content_markdown, properties)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((blocks: Block[]) => {
    for (const block of blocks) {
      if (!block.id) {
        continue;
      }

      const contentMarkdown = block.content
        .map((token) => {
          return token.toMarkdown();
        })
        .join("")
        .trimEnd();

      const parentId = block.parent?.id || block.parentId || null;

      let orderIndex = 0;
      if (block.parent) {
        orderIndex = block.parent.children.indexOf(block);
      }

      insert.run([
        block.id,
        block.pageId || "",
        parentId,
        block.depth,
        orderIndex,
        JSON.stringify(block.content),
        contentMarkdown || "",
        JSON.stringify(createPropertyMap(block.properties || [])),
      ]);
    }
  });
  insertMany(blocks);
}

  function createPropertyMap(properties: unknown[][]): object {
    // RV: Avoid using 'any'; define a typed structure for the property map.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

import { createToken, Token, TokenType, PropertyPair, Marker } from "./token";
import { Lexer } from "./lexer";
import { Parser } from "./parser";

/**
 * For simplicity, Block includes items only used on the client side.
 */
export class Block {
  public id?: string;
  public parentId?: string;
  public pageId?: string;

  public contentMarkdown?: string;
  public backlinks?: Block[];
  public properties?: unknown[][];
  public parent?: Block;

  constructor(
    public content: Token[],
    public depth: number,
    public children: Block[],
  ) {}

  withId(id: string): Block {
    this.id = id;
    return this;
  }

  withProperties(properties: unknown[][]): Block {
    this.properties = properties;
    return this;
  }

  withParent(parent: Block): Block {
    this.parent = parent;
    return this;
  }

  /**
   * Retrieve the next block in a pre-order depth-first tree traversal.
   *
   * cf. Tree traversal - Wikipedia https://en.wikipedia.org/wiki/Tree_traversal
   */
  getNext(): Block | null {
    // case 1: current has children
    //   Return the first child
    if (this.children.length > 0) {
      return this.children[0];
    }

    // case 2: current has no children
    //   Go up the tree until we find a parent that has a next sibling
    let current: Block = create(this);
    // @owner Verbose console logging in core traversal can degrade performance and spam logs; remove or guard under debug flag.
    console.log(current);
    while (current.parent) {
      const [parent, currentIdx] = current.getParentAndIdx();
      if (!parent || currentIdx === -1) {
        console.debug("no parent at getNextBlock");
        return null;
      }
      if (currentIdx < parent.children.length - 1) {
        return parent.children[currentIdx + 1];
      }
      current = parent;
    }
    console.debug("no parent at getNextBlock");
    return null;
  }

  /**
   * Retrieve the previous block in a pre-order depth-first tree traversal.
   *
   * cf. Tree traversal - Wikipedia https://en.wikipedia.org/wiki/Tree_traversal
   */
  getPrevious(): Block | undefined {
    const [parent, idx] = this.getParentAndIdx();
    if (!parent) {
      console.warn("no parent at getPrevBlock");
      return undefined;
    }
    if (idx === 0) {
      return parent;
    }

    const closestOlderSibling = parent.children[idx - 1];
    return closestOlderSibling.getLastDescendant();
  }

  /**
   * Returns the last descendant of the current block, including itself.
   */
  getLastDescendant(): Block | undefined {
    if (this.children.length === 0) {
      return this;
    }
    return this.getLastChild().getLastDescendant();
  }

  getLastChild(): Block {
    return this.children[this.children.length - 1];
  }

  getParentAndIdx(): [Block | null, number] {
    if (!this.parent?.children) {
      // @owner Avoid logging on hot paths; consider returning `[-1]` and letting callers handle quietly.
      console.log("Block has no parent or the parent has no children.");
      return [null, -1];
    }

    const idx = this.parent.children.findIndex((child) => child.id === this.id);
    return [this.parent, idx];
  }

  /**
   * Retrieve its descendant block by its id.
   *
   * NOTE: This function has a time complexity: O(the number of descendant blocks).
   * This is acceptable because the number of descendant blocks is expected to be small (< 1000)
   */
  getBlockById(id: string): Block | null {
    if (this.id === id) {
      return this;
    }

    for (const child of this.children) {
      const found = child.getBlockById(id);
      if (found) {
        return found;
      }
    }

    return null;
  }

  toJSON(): unknown {
    return {
      content: this.content,
      contentMarkdown: this.contentMarkdown,
      depth: this.depth,
      children: this.children.map((child) => child.toJSON()),
      properties: this.properties,
      id: this.id,
      parentId: this.parentId,
      backlinks: this.backlinks,
      pageId: this.pageId,
    };
  }

  increaseLevel(): void {
    const [parent, currentIdx] = this.getParentAndIdx();
    if (!parent || currentIdx === -1) {
      console.log("Block has no parent:", this);
      return;
    }

    if (currentIdx === 0) {
      console.log("Cannot indent block that is the first child of its parent.");
      return;
    }

    const siblingsBefore = parent.children.slice(0, currentIdx);
    const prevSibling = siblingsBefore[siblingsBefore.length - 1];

    this.parent = prevSibling;
    prevSibling.children.push(this);

    const siblingsAfter = parent.children.slice(currentIdx + 1);
    parent.children = [...siblingsBefore, ...siblingsAfter];
  }

  decreaseLevel(): void {
    const [parent, currentIdx] = this.getParentAndIdx();
    if (!parent || currentIdx === -1) {
      console.log("Block has no parent:", this);
      return;
    }

    const [grandParent, parentIdx] = parent.getParentAndIdx();
    if (!grandParent || parentIdx === -1) {
      console.log("Parent has no parent:", parent);
      return;
    }

    const siblingsBefore = parent.children.slice(0, currentIdx);
    const siblingsAfter = parent.children.slice(currentIdx + 1);

    parent.children = siblingsBefore;
    this.parent = grandParent;
    this.children = [...this.children, ...siblingsAfter];
    this.children.forEach((b) => {
      b.parent = this;
    });

    grandParent.children[parentIdx] = parent;
    grandParent.children.splice(parentIdx + 1, 0, this);
  }

  getProperty(key: string): unknown {
    if (!this.properties) {
      return undefined;
    }
    const property = this.properties.find((p) => p[0] === key);
    if (property) {
      return property[1];
    }
    return undefined;
  }

  setProperty(key: string, value: unknown): void {
    if (!this.properties) {
      this.properties = [];
    }
    const property = this.properties.find((p) => p[0] === key);
    if (property) {
      property[1] = value;
    } else {
      this.properties.push([key, value]);
    }
  }

  hasChildren(): boolean {
    return this.children.length > 0;
  }

  flatten(): Block[] {
    const blocks: Block[] = [this];
    for (const child of this.children) {
      blocks.push(...child.flatten());
    }
    return blocks;
  }

  getContentMarkdownHead(): string {
    const markdown = this.content
      .map((token) => {
        return token.toMarkdown();
      })
      .join("")
      .replaceAll(/\n/g, "\n  ")
      .trimEnd();
    return markdown.split("\n")[0];
  }

  setPropertiesFromContent(): void {
    const propertyPairs: PropertyPair[] = this.content.filter(
      (token): token is PropertyPair => token.type === TokenType.PropertyPair,
    );
    propertyPairs.forEach((pair) => {
      const [k, v] = pair.toPair();
      this.setProperty(k, v.trim());
    });

    const marker = this.content.find(
      (token): token is Token => token.type === TokenType.Marker,
    ) as Marker;
    if (marker) {
      this.setProperty("status", marker.status.trim());
    }
  }
}

export function create(block: Block): Block {
  const content: Token[] = block.content.map((token) => createToken(token));

  const newBlock = new Block(
    content,
    block.depth,
    block.children.map((child) => create(child)),
  );
  newBlock.children.forEach((child) => {
    child.parent = newBlock;
  });
  newBlock.contentMarkdown = block.contentMarkdown;
  newBlock.backlinks = block.backlinks;
  newBlock.pageId = block.pageId;
  newBlock.id = block.id;
  newBlock.parentId = block.parentId;
  newBlock.parent = block.parent;

  newBlock.properties = block.properties;
  newBlock.setPropertiesFromContent();

  return newBlock;
}

export function refreshBlockFromPageUpdate(block: Block): Block {
  const contentMarkdown = block.contentMarkdown || "";
  const lexer = new Lexer("- " + contentMarkdown); // FIXME
  const tokens = lexer.exec();
  const parser = new Parser(tokens);
  const blockForMarkdown = parser.parse();

  block.content = blockForMarkdown.children[0].content;
  block.properties = blockForMarkdown.children[0].properties;
  block.children = block.children.map(refreshBlockFromPageUpdate);

  return block;
}

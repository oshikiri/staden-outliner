import { Block } from "./block";
import {
  Token,
  ListStart,
  Quote,
  Text,
  Newline,
  Heading,
  PropertyPair,
  PropertyPairSeparator,
  Marker,
} from "./token";

export class Parser {
  stack: Block[] = [];
  constructor(public tokens: Token[]) {}

  public parse(): Block {
    let stack = this.scanAllTokens();
    stack = this.collapseTailUntil(stack, 0);
    if (stack.length === 1) {
      return stack[0];
    }
    // @owner Serializing the entire stack in the error message can be expensive; include a concise summary instead.
    throw new Error(
      `Invalid stack length = ${stack.length}\n${JSON.stringify(stack)}`,
    );
  }

  scanAllTokens(): Block[] {
    this.stack = [new Block([], 0, [])];

    let i = 0;
    while (i < this.tokens.length) {
      const token = this.tokens[i];
      if (token instanceof Newline) {
        i = this.consumeNewline(i);
      } else if (token instanceof ListStart) {
        i = this.consumeListStart(i, token);
      } else if (token instanceof Heading) {
        i = this.consumeHeading(i, token);
      } else if (isLogbookHeader(token)) {
        i = this.consumeLogbook(i, token);
      } else if (token instanceof Quote) {
        i = this.consumeQuote(i);
      } else if (token instanceof PropertyPairSeparator) {
        i = this.consumePropertyPair(i);
      } else if (token instanceof Marker) {
        i = this.consumeMarker(i, token);
      } else {
        i = this.consumeOthers(i, token);
      }
    }

    return this.stack;
  }

  consumeNewline(i: number): number {
    i++; // consume Newline
    const lastBlock = this.stack.pop();
    if (!lastBlock) {
      return i;
    }

    if (lastBlock.content.length === 0) {
      this.stack.push(lastBlock);
      return i;
    }

    lastBlock.content.push(new Newline());
    this.stack.push(lastBlock);

    return i;
  }

  collapseTailUntil(stack: Block[], depth: number): Block[] {
    let tail = stack.pop();
    if (!tail) {
      return [];
    }

    while (tail.depth > depth) {
      let previous = stack.pop();
      if (!previous) {
        break;
      }

      if (previous.depth === tail.depth) {
        const children = [tail];
        while (previous.depth === tail.depth) {
          children.push(previous);
          previous = stack.pop();
          if (!previous) {
            throw Error("Invalid stack: previous is undefined");
          }
        }
        // The current `previous` is the parent of children
        previous.children = children.reverse().map(fixContent);
      } else {
        previous.children.push(fixContent(tail));
      }
      tail = previous;
    }
    stack.push(tail);
    return stack;
  }

  consumeListStart(i: number, listStart: ListStart): number {
    const depth = listStart.depth;
    this.collapseTailUntil(this.stack, depth);
    this.stack.push(new Block([], depth, []));
    i++; // consume ListStart
    return i;
  }

  consumeHeading(i: number, token: Heading): number {
    i++; // consume Heading

    // consume heading contents
    let t = this.tokens[i];
    while (t !== undefined && !(t instanceof Newline)) {
      token.content.push(t);
      i++;
      t = this.tokens[i];
    }
    i++; // consume Newline

    const last = this.stack.pop();
    if (last) {
      if (last.depth === 0) {
        this.stack.push(last);
        this.stack.push(new Block([token], 1, []));
      } else {
        last.content.push(token);
        this.stack.push(last);
      }
    } else {
      this.stack.push(new Block([token], 1, []));
    }

    return i;
  }

  consumeLogbook(i: number, token: Token): number {
    i++; // consume logbook header
    while (i < this.tokens.length) {
      if (
        token instanceof Text &&
        token.textContent.trimStart().startsWith(":END:")
      ) {
        i++; // consume logbook footer
        break;
      }
      i++;
      token = this.tokens[i];
    }
    return i;
  }

  consumeQuote(i: number): number {
    let last = this.stack.pop();
    if (!last) {
      last = new Block([], 0, []);
    }

    const quote = new Quote([]);
    let currentToken = this.tokens[i];
    while (currentToken instanceof Quote) {
      // consume Quote token
      i++;

      const tokens = [];
      while (i < this.tokens.length && !(this.tokens[i] instanceof Newline)) {
        tokens.push(this.tokens[i]);
        i++; // consume i-th token
      }

      if (this.tokens[i] instanceof Newline) {
        i++;
        tokens.push(new Newline());
      }

      quote.tokens = quote.tokens.concat(tokens);

      currentToken = this.tokens[i];
    }

    last.content.push(quote);
    this.stack.push(last);

    return i;
  }

  consumePropertyPair(i: number): number {
    if (this.stack.length === 1) {
      this.stack.push(new Block([new ListStart(1)], 1, []));
    }
    const tail = this.stack.pop();
    if (!tail) {
      // @owner This fallback constructs a malformed structure instead of recovering gracefully; consider skipping invalid pairs.
      this.stack.push(new Block([], 0, [new Block([new Text("::")], 1, [])]));
      i++;
      return i;
    }

    const key = tail.content.pop();
    if (!key || !(key instanceof Text)) {
      tail.content.push(new Text("::"));
      this.stack.push(tail);
      i++;
      return i;
    }

    i++; // consume PropertyPairSeparator
    const pair = new PropertyPair(key, []);
    while (i < this.tokens.length && !(this.tokens[i] instanceof Newline)) {
      pair.value.push(this.tokens[i]);
      i++;
    }
    i++; // consume Newline
    tail.content.push(pair);

    tail.properties = tail.properties || [];
    const value: string = pair.value
      .map((t: Token) => t.toText())
      .join("")
      .trim();
    tail.properties.push([key.textContent, value]);

    if (key.textContent === "id") {
      tail.id = value.trim();
    }

    this.stack.push(tail);

    return i;
  }

  consumeMarker(i: number, marker: Marker): number {
    const last = this.stack.pop();
    if (!last) {
      throw Error("this.stack is empty");
    }

    last.content.push(marker);
    this.stack.push(last);

    i++; // consume Marker
    return i;
  }

  consumeOthers(i: number, token: Token): number {
    if (this.stack.length === 1) {
      this.stack.push(new Block([new ListStart(1)], 1, []));
    }

    const last = this.stack.pop();
    if (!last) {
      throw Error("this.stack is empty");
    }

    last.content.push(token);
    this.stack.push(last);
    i++; // consume token

    return i;
  }
}

function isLogbookHeader(token: Token): boolean {
  return token instanceof Text && token.textContent === ":LOGBOOK:";
}

function fixContent(block: Block): Block {
  const last = block.content[block.content.length - 1];
  if (last instanceof Newline) {
    block.content.pop();
  }

  return block;
}

import { Block } from "./block";

export enum TokenType {
  Base = 0,
  NewLine = 1,
  Image = 2,
  ListStart = 3,
  Text = 4,
  PageRef = 5,
  Link = 6,
  PropertyPair = 7,
  Heading = 8,
  Quote = 9,
  InlineCode = 10,
  CodeBlock = 11,
  PropertyPairSeparator = 12,
  BlockRef = 13,
  Command = 14,
  CommandQuery = 15,
  Marker = 16,
}

export class Token {
  type: TokenType = TokenType.Base;
  toMarkdown(): string {
    return "";
  }
  toText(): string {
    // RV: Uses `any` cast to access `textContent`; prefer a typed union or a virtual method on subclasses for safer access.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this as any).textContent || "";
  }
}

export class Newline extends Token {
  type: TokenType = TokenType.NewLine;
  toMarkdown(): string {
    return "\n";
  }
}

// ![image.png](../assets/xxxxx.png){:height 426, :width 551}
export class Image extends Token {
  type: TokenType = TokenType.Image;
  constructor(
    public src: string,
    public alt: string,
    public width?: string,
    public height?: string,
  ) {
    super();
  }

  toMarkdown(): string {
    const sizeOptions = [];
    if (this.height) {
      sizeOptions.push(`:height ${this.height}`);
    }
    if (this.width) {
      sizeOptions.push(`:width ${this.width}`);
    }
    if (sizeOptions.length === 0) {
      return `![${this.alt}](${this.src})`;
    }
    return `![${this.alt}](${this.src}){${sizeOptions.join(", ")}}`;
  }
}

export class ListStart extends Token {
  type: TokenType = TokenType.ListStart;
  constructor(public depth: number) {
    super();
  }
}

export class Heading extends Token {
  type: TokenType = TokenType.Heading;
  constructor(
    public level: number,
    public content: Token[] = [],
  ) {
    super();
  }
  toMarkdown(): string {
    const heading = this.content
      .map((t) => t.toMarkdown())
      .join("")
      .trim();
    return `${"#".repeat(this.level)} ${heading}\n`;
  }
}

export class Text extends Token {
  type: TokenType = TokenType.Text;
  constructor(public textContent: string) {
    super();
  }
  toMarkdown(): string {
    return this.textContent;
  }
}

export class PageRef extends Token {
  type: TokenType = TokenType.PageRef;
  constructor(public title: string) {
    super();
  }
  toMarkdown(): string {
    return `[[${this.title}]]`;
  }
  toText(): string {
    return this.title;
  }
}

export class Link extends Token {
  type: TokenType = TokenType.Link;
  constructor(
    public url: string,
    public title: string,
  ) {
    super();
  }
  toMarkdown(): string {
    if (this.title === this.url) {
      return this.url;
    }
    return `[${this.title}](${this.url})`;
  }
}

export class Quote extends Token {
  type: TokenType = TokenType.Quote;
  constructor(public tokens: Token[]) {
    super();
  }
  toMarkdown(): string {
    const markdown = this.tokens
      .map((t) => t.toMarkdown())
      .join("")
      .trim();
    return `>${markdown.replaceAll("\n", "\n>")}`;
  }
}

export class InlineCode extends Token {
  type: TokenType = TokenType.InlineCode;
  constructor(public textContent: string) {
    super();
  }
  toMarkdown(): string {
    return `\`${this.textContent}\``;
  }
}

export class CodeBlock extends Token {
  type: TokenType = TokenType.CodeBlock;
  constructor(
    public textContent: string,
    public lang: string,
  ) {
    super();
  }
  toMarkdown(): string {
    return `\`\`\`${this.lang}\n${this.textContent}\`\`\``;
  }
}

export class PropertyPairSeparator extends Token {
  type: TokenType = TokenType.PropertyPairSeparator;
  constructor() {
    super();
  }
}

export class PropertyPair extends Token {
  type: TokenType = TokenType.PropertyPair;
  constructor(
    public key: Token,
    public value: Token[],
  ) {
    super();
  }
  toMarkdown(): string {
    return `${this.key.toMarkdown()}:: ${this.value.map((v) => v.toMarkdown()).join(" ")}\n`;
  }
  toPair(): [string, string] {
    // @owner Key uses `toMarkdown()` which may include formatting; consider `toText()` to extract plain key.
    return [this.key.toMarkdown(), this.value.map((v) => v.toText()).join("")];
  }
}

export class BlockRef extends Token {
  type: TokenType = TokenType.BlockRef;
  constructor(
    public id: string,
    public resolvedContent?: Token[],
  ) {
    super();
  }
  toMarkdown(): string {
    return `((${this.id}))`;
  }
}

export class Command extends Token {
  type: TokenType = TokenType.Command;
  resolvedContent?: Token[];
  resolvedBlocks?: Block[];
  constructor(
    public name: string,
    public args: string,
  ) {
    super();
  }
  toMarkdown(): string {
    return `{{${this.name} ${this.args}}}`;
  }
}

export class CommandQuery extends Token {
  type: TokenType = TokenType.CommandQuery;
  constructor(
    public query: string,
    public resolvedBlocks?: Block[],
    public vlJsonStr?: string,
    public resolvedDataForVlJson?: unknown[],
    public queryExecutionMilliseconds?: number,
  ) {
    super();
    if (resolvedBlocks) {
      this.resolvedBlocks = resolvedBlocks;
    }
  }
  toMarkdown(): string {
    return `{{query ${this.query}}}`;
  }
}

export class Marker extends Token {
  type: TokenType = TokenType.Marker;
  constructor(public status: string) {
    super();
  }
  toMarkdown(): string {
    return this.status + " ";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createToken(obj: any): Token {
  // @owner `obj` is `any`; add runtime validation or a type guard to prevent crashes from malformed input.
  const tokenType = obj.type;
  switch (tokenType) {
    case TokenType.NewLine:
      return new Newline();
    case TokenType.Image:
      return new Image(obj.src, obj.alt, obj.width, obj.height);
    case TokenType.ListStart:
      return new ListStart(obj.depth);
    case TokenType.Heading:
      return new Heading(obj.level, obj.content.map(createToken));
    case TokenType.Text:
      return new Text(obj.textContent);
    case TokenType.PageRef:
      return new PageRef(obj.title);
    case TokenType.Link:
      return new Link(obj.url, obj.title);
    case TokenType.Quote:
      return new Quote(obj.tokens.map(createToken));
    case TokenType.InlineCode:
      return new InlineCode(obj.textContent);
    case TokenType.CodeBlock:
      return new CodeBlock(obj.textContent, obj.lang);
    case TokenType.PropertyPair:
      return new PropertyPair(createToken(obj.key), obj.value.map(createToken));
    case TokenType.PropertyPairSeparator:
      return new PropertyPairSeparator();
    case TokenType.BlockRef:
      return new BlockRef(obj.id, obj.resolvedContent?.map(createToken));
    case TokenType.Command:
      return new Command(obj.name, obj.args);
    case TokenType.CommandQuery:
      return new CommandQuery(
        obj.query,
        obj.resolvedBlocks,
        obj.vlJsonStr,
        obj.resolvedDataForVlJson,
        obj.queryExecutionMilliseconds,
      );
    case TokenType.Marker:
      return new Marker(obj.status);
    default:
      // Throwing with full serialized object may leak sensitive data; include only minimal info.
      throw new Error(`Unknown token type: ${JSON.stringify(obj)}`);
  }
}

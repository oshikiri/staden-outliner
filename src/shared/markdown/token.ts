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
    return this.getTextContent() ?? "";
  }

  protected getTextContent(): string | undefined {
    return undefined;
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
  protected getTextContent(): string | undefined {
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
  protected getTextContent(): string | undefined {
    return this.textContent;
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
  protected getTextContent(): string | undefined {
    return this.textContent;
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

export type CommandQueryRow = Record<string, unknown>;

export class CommandQuery extends Token {
  type: TokenType = TokenType.CommandQuery;
  constructor(
    public query: string,
    public resolvedBlocks?: CommandQueryRow[],
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

const tokenTypes: TokenType[] = [
  TokenType.NewLine,
  TokenType.Image,
  TokenType.ListStart,
  TokenType.Text,
  TokenType.PageRef,
  TokenType.Link,
  TokenType.PropertyPair,
  TokenType.Heading,
  TokenType.Quote,
  TokenType.InlineCode,
  TokenType.CodeBlock,
  TokenType.PropertyPairSeparator,
  TokenType.BlockRef,
  TokenType.Command,
  TokenType.CommandQuery,
  TokenType.Marker,
];

export function createToken(obj: unknown): Token {
  if (!isRecord(obj)) {
    throw new Error("Invalid token dto: expected object");
  }
  const tokenType = readTokenType(obj);
  const tokenFactory = tokenFactories[tokenType];
  if (!tokenFactory) {
    // Throwing with full serialized object may leak sensitive data; include only minimal info.
    throw new Error(`Unknown token type: ${JSON.stringify(obj)}`);
  }
  return tokenFactory(obj);
}

const tokenFactories: Partial<
  Record<TokenType, (obj: Record<string, unknown>) => Token>
> = {
  [TokenType.NewLine]: () => new Newline(),
  [TokenType.Image]: (obj) =>
    new Image(
      readString(obj, "src"),
      readString(obj, "alt"),
      typeof obj.width === "string" ? obj.width : undefined,
      typeof obj.height === "string" ? obj.height : undefined,
    ),
  [TokenType.ListStart]: (obj) => new ListStart(readNumber(obj, "depth")),
  [TokenType.Heading]: createHeadingToken,
  [TokenType.Text]: (obj) => new Text(readString(obj, "textContent")),
  [TokenType.PageRef]: (obj) => new PageRef(readString(obj, "title")),
  [TokenType.Link]: (obj) =>
    new Link(readString(obj, "url"), readString(obj, "title")),
  [TokenType.Quote]: (obj) =>
    new Quote(readTokenArray(obj, "tokens").map(createToken)),
  [TokenType.InlineCode]: (obj) =>
    new InlineCode(readString(obj, "textContent")),
  [TokenType.CodeBlock]: (obj) =>
    new CodeBlock(readString(obj, "textContent"), readString(obj, "lang")),
  [TokenType.PropertyPair]: createPropertyPairToken,
  [TokenType.PropertyPairSeparator]: () => new PropertyPairSeparator(),
  [TokenType.BlockRef]: createBlockRefToken,
  [TokenType.Command]: (obj) =>
    new Command(readString(obj, "name"), readString(obj, "args")),
  [TokenType.CommandQuery]: createCommandQueryToken,
  [TokenType.Marker]: (obj) => new Marker(readString(obj, "status")),
};

export function isTokenType(value: unknown): value is TokenType {
  return typeof value === "number" && tokenTypes.includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readTokenType(obj: Record<string, unknown>): TokenType {
  const tokenType = obj.type;
  if (typeof tokenType !== "number") {
    throw new Error("Invalid token dto: missing numeric type");
  }
  return tokenType;
}

function readString(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  if (typeof value !== "string") {
    throw new Error(`Invalid token dto: ${key} must be a string`);
  }
  return value;
}

function readNumber(obj: Record<string, unknown>, key: string): number {
  const value = obj[key];
  if (typeof value !== "number") {
    throw new Error(`Invalid token dto: ${key} must be a number`);
  }
  return value;
}

function readTokenArray(obj: Record<string, unknown>, key: string): unknown[] {
  const value = obj[key];
  if (!Array.isArray(value)) {
    throw new Error(`Invalid token dto: ${key} must be an array`);
  }
  return value;
}

function readOptionalTokenArray(
  obj: Record<string, unknown>,
  key: string,
): unknown[] | undefined {
  const value = obj[key];
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error(`Invalid token dto: ${key} must be an array`);
  }
  return value;
}

function createHeadingToken(obj: Record<string, unknown>): Heading {
  return new Heading(
    readNumber(obj, "level"),
    readTokenArray(obj, "content").map(createToken),
  );
}

function createPropertyPairToken(obj: Record<string, unknown>): PropertyPair {
  return new PropertyPair(
    createToken(obj.key),
    readTokenArray(obj, "value").map(createToken),
  );
}

function createBlockRefToken(obj: Record<string, unknown>): BlockRef {
  return new BlockRef(
    readString(obj, "id"),
    readOptionalTokenArray(obj, "resolvedContent")?.map(createToken),
  );
}

function createCommandQueryToken(obj: Record<string, unknown>): CommandQuery {
  return new CommandQuery(
    readString(obj, "query"),
    readOptionalRecordArray(obj, "resolvedBlocks"),
    typeof obj.vlJsonStr === "string" ? obj.vlJsonStr : undefined,
    Array.isArray(obj.resolvedDataForVlJson)
      ? obj.resolvedDataForVlJson
      : undefined,
    typeof obj.queryExecutionMilliseconds === "number"
      ? obj.queryExecutionMilliseconds
      : undefined,
  );
}

function readOptionalRecordArray(
  obj: Record<string, unknown>,
  key: string,
): CommandQueryRow[] | undefined {
  const value = obj[key];
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || !value.every(isRecord)) {
    throw new Error(`Invalid token dto: ${key} must be an array of objects`);
  }
  return value;
}

import {
  Token,
  ListStart,
  Image,
  PageRef,
  Link,
  CodeBlock,
  Text,
  PropertyPairSeparator,
  Quote,
  InlineCode,
  Heading,
  Newline,
  BlockRef,
  Command,
  CommandQuery,
  Marker,
} from "./token";

export class Lexer {
  private depth: number;

  public constructor(public content: string) {
    this.depth = 1;
  }

  public exec(): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    let linestart = true;
    let token: Token;

    while (i < this.content.length) {
      if (this.startsWith(i, "\n")) {
        [i, token] = this.consumeNewline(i);
      } else if (linestart && this.atListStart(i)) {
        [i, token] = this.consumeListStart(i);
      } else if (linestart && this.startsWith(i, "#")) {
        [i, token] = this.consumeHeading(i);
      } else if (linestart && this.startsWith(i, ">")) {
        [i, token] = this.consumeQuote(i);
      } else if (linestart && this.startsWith(i, "TODO ")) {
        [i, token] = this.consumeTaskStatus(i, "TODO");
      } else if (linestart && this.startsWith(i, "DOING ")) {
        [i, token] = this.consumeTaskStatus(i, "DOING");
      } else if (linestart && this.startsWith(i, "DONE ")) {
        [i, token] = this.consumeTaskStatus(i, "DONE");
      } else if (this.startsWith(i, "![")) {
        [i, token] = this.consumeImage(i);
      } else if (this.startsWith(i, "[[")) {
        [i, token] = this.consumePageRef(i);
      } else if (this.startsWith(i, "[")) {
        [i, token] = this.consumeLink(i);
      } else if (this.startsWith(i, "```")) {
        [i, token] = this.consumeCodeBlock(i);
      } else if (this.startsWith(i, "`")) {
        [i, token] = this.consumeInlineCode(i);
      } else if (this.isHeadOfUrl(i)) {
        [i, token] = this.consumeUrl(i);
      } else if (this.startsWith(i, "::")) {
        [i, token] = this.consumePropertyPairSeparator(i);
      } else if (this.startsWith(i, "((")) {
        [i, token] = this.consumeBlockReference(i);
      } else if (this.startsWith(i, "{{")) {
        [i, token] = this.consumeCommand(i);
      } else {
        [i, token] = this.consumeOneCharacter(i);
      }
      tokens.push(token);
      linestart = token instanceof Newline || token instanceof ListStart;
    }

    return this.concatConsecutiveTextTokens(tokens);
  }

  consumeOneCharacter(i: number): [number, Text] {
    return [i + 1, new Text(this.content[i])];
  }

  consumeUntil(i: number, end: string): [number, string] {
    let text = "";
    [i, text] = this.consumeWhile(i, (c) => c !== end);
    i++; // pop the end
    return [i, text];
  }

  consumeUntilMulti(i: number, end: string): [number, string] {
    let c = this.content[i];
    const predicate = (i: number) => {
      return this.content.slice(i, i + end.length) !== end;
    };
    let content = "";
    while (c && predicate(i)) {
      i++;
      content += c;
      c = this.content[i];
    }
    i += end.length; // pop the end
    return [i, content];
  }

  isHeadOfUrl(i: number): boolean {
    return this.startsWith(i, "https://") || this.startsWith(i, "http://");
  }

  startsWith(i: number, prefix: string): boolean {
    const prefixLength = prefix.length;
    return this.content.slice(i, i + prefixLength) === prefix;
  }

  consumeWhile(i: number, predicate: (c: string) => boolean): [number, string] {
    let c = this.content[i];
    let content = "";
    while (c && predicate(c)) {
      i++;
      content += c;
      c = this.content[i];
    }
    return [i, content];
  }

  consumeNewline(i: number): [number, Newline] {
    i++; // pop `\n`
    [i, this.depth] = this.consumeHeadTabs(i);
    [i] = this.consumeWhile(i, (c) => c === " ");
    return [i, new Newline()];
  }

  consumeHeading(i: number): [number, Heading] {
    let headingChars = "";
    [i, headingChars] = this.consumeWhile(i, (c) => c === "#");
    const headingLevel = headingChars.length;
    return [i, new Heading(headingLevel)];
  }

  consumeWhitespaces(i: number): [number, number] {
    let headingChars = "";
    [i, headingChars] = this.consumeWhile(i, (c) => c === "\t" || c === " ");
    const depth = headingChars.length;
    return [i, depth];
  }

  // depth == 0 means root node (page)
  consumeHeadTabs(i: number): [number, number] {
    let tabs: string;
    [i, tabs] = this.consumeWhile(i, (c) => c === "\t");
    const depth = tabs.length + 1;
    return [i, depth];
  }

  atListStart(i: number): boolean {
    const c0 = this.content[i];
    const c1 = this.content[i + 1];
    return (
      c0 === "-" &&
      (c1 === " " || c1 === "\t" || c1 === "\n" || c1 === undefined)
    );
  }

  consumeListStart(i: number): [number, ListStart] {
    const c1 = this.content[i + 1];
    i++; // pop `-`
    if (c1 === " " || c1 === "\t") {
      i++; // pop the second ` `
    }
    return [i, new ListStart(this.depth)];
  }

  consumeImage(i: number): [number, Image] {
    i += 2; // pop `![`
    let src, alt: string;
    [i, alt] = this.consumeUntil(i, "]");
    i++; // pop `(`
    [i, src] = this.consumeUntil(i, ")");
    if (!this.startsWith(i, "{:")) {
      return [i, new Image(src, alt)];
    }

    let content = "";
    [i, content] = this.consumeUntil(i, "}");
    const width = content.match(/:width (\d+)/);
    const height = content.match(/:height (\d+)/);

    return [
      i,
      new Image(
        src,
        alt,
        width ? width[1] : undefined,
        height ? height[1] : undefined,
      ),
    ];
  }

  consumePageRef(i: number): [number, PageRef] {
    i += 2; // pop `[[`
    let title = "";
    [i, title] = this.consumeUntil(i, "]");
    i++; // pop the second `]`
    return [i, new PageRef(title)];
  }

  consumeUrl(i: number): [number, Link] {
    let url = "";
    [i, url] = this.consumeWhile(i, (c) => c !== " " && c !== "\n");
    return [i, new Link(url, url)];
  }

  consumeLink(i: number): [number, Link | Text] {
    i++; // pop `[`
    let alt = "";
    [i, alt] = this.consumeUntil(i, "]");

    const c = this.content[i];
    if (c !== "(") {
      return [i, new Text(`[${alt}]`)];
    }
    i++; // pop `(`

    let src = "";
    [i, src] = this.consumeUntil(i, ")");
    return [i, new Link(src, alt)];
  }

  consumeInlineCode(i: number): [number, InlineCode] {
    i++; // pop the first "`"
    let code = "";
    [i, code] = this.consumeUntil(i, "`");
    return [i, new InlineCode(code)];
  }

  consumeCodeBlock(i: number): [number, CodeBlock] {
    i += 3; // pop three "`"

    let lang = "plaintext";
    const next = this.content[i];
    if (next === "\n") {
      i++; // pop `\n`
    } else {
      [i, lang] = this.consumeUntil(i, "\n");
    }

    let depth = 0;
    [i, depth] = this.consumeWhitespaces(i);

    let code = "";
    [i, code] = this.consumeUntilMulti(i, "```");
    code = code.replaceAll(new RegExp(`^[\\t ]{${depth}}`, "mg"), "");
    return [i, new CodeBlock(code, lang)];
  }

  consumeQuote(i: number): [number, Quote] {
    i++; // pop `>`
    return [i, new Quote([])];
  }

  consumePropertyPairSeparator(i: number): [number, PropertyPairSeparator] {
    return [i + 2, new PropertyPairSeparator()];
  }

  concatConsecutiveTextTokens(tokens: Token[]): Token[] {
    const merged: Token[] = [];
    let text = "";
    for (const token of tokens) {
      if (token instanceof Text) {
        text += token.textContent;
      } else {
        if (text.length > 0) {
          merged.push(new Text(text));
          text = "";
        }
        merged.push(token);
      }
    }
    if (text.length > 0) {
      merged.push(new Text(text));
    }
    return merged;
  }

  consumeBlockReference(i: number): [number, BlockRef] {
    i += 2; // pop `((`
    let id = "";
    [i, id] = this.consumeUntil(i, ")");
    i += 1; // pop the second `)`
    return [i, new BlockRef(id)];
  }

  consumeCommand(i: number): [number, Command | CommandQuery] {
    i += 2; // pop `{{`
    let text = "";
    [i, text] = this.consumeUntil(i, "}");
    i += 1; // pop the second `}`
    const [commandType, ...commandArgs] = text.split(" ");

    if (commandType === "query") {
      const queryString = commandArgs.join(" ");
      return [i, new CommandQuery(queryString)];
    }

    return [i, new Command(commandType, commandArgs.join(" "))];
  }

  consumeTaskStatus(i: number, status: string): [number, Marker] {
    i += status.length + 1;
    return [i, new Marker(status)];
  }
}

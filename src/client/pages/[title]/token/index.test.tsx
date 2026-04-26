import { beforeEach, describe, expect, jest, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import * as Logger from "@/shared/logger";
import type { Token as MarkdownToken } from "@/shared/markdown/token";
import {
  BlockRef as BlockRefEntity,
  CodeBlock as CodeBlockEntity,
  Command as CommandEntity,
  CommandQuery as CommandQueryEntity,
  Heading as HeadingEntity,
  Image as ImageEntity,
  InlineCode as InlineCodeEntity,
  Link as LinkEntity,
  ListStart as ListStartEntity,
  Marker as MarkerEntity,
  Newline as NewlineEntity,
  PageRef as PageRefEntity,
  PropertyPair as PropertyPairEntity,
  Quote as QuoteEntity,
  Text as TextEntity,
  Token as TokenEntity,
} from "@/shared/markdown/token";
import { Marker as MarkerComponent, Token as TokenComponent } from "./index";

describe("token renderer", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("renders basic token types through the dispatcher", () => {
    expect(renderToken(new TextEntity("plain text"))).toContain("plain text");
    expect(renderToken(new ListStartEntity(1))).toBe("");
    expect(renderToken(new NewlineEntity())).toContain("<br");
    expect(
      renderToken(
        new HeadingEntity(2, [
          new TextEntity("Heading"),
          new InlineCodeEntity("x"),
        ]),
      ),
    ).toContain("##");
    expect(
      renderToken(
        new HeadingEntity(2, [
          new TextEntity("Heading"),
          new InlineCodeEntity("x"),
        ]),
      ),
    ).toContain("<code");
    expect(
      renderToken(
        new HeadingEntity(2, [
          new TextEntity("Heading"),
          new InlineCodeEntity("x"),
        ]),
      ),
    ).toContain("<span>Heading</span>");
    expect(
      renderToken(new CodeBlockEntity("const x = 1;", "madeuplang")),
    ).toContain("const x = 1;");
    expect(
      renderToken(new ImageEntity("image.png", "alt text", "200", "300")),
    ).toContain('src="/api/images?path=image.png"');
    expect(renderToken(new InlineCodeEntity("code"))).toContain("<code");
    expect(renderToken(new QuoteEntity([new TextEntity("quoted")]))).toContain(
      "<blockquote",
    );
    expect(renderToken(new QuoteEntity([new TextEntity("quoted")]))).toContain(
      "quoted",
    );
  });

  test("renders page, link, property, block, command, query, and marker tokens", () => {
    expect(renderToken(new PageRefEntity("foo bar"))).toContain(
      'href="/pages/foo%20bar"',
    );
    expect(
      renderToken(new LinkEntity("https://example.com", "example")),
    ).toContain('target="_blank"');
    expect(renderToken(new LinkEntity("foo", "foo"))).toBe("<span>foo</span>");
    expect(
      renderToken(
        new PropertyPairEntity(new TextEntity("title"), [
          new TextEntity("value"),
        ]),
      ),
    ).toContain('href="/pages/title"');
    expect(
      renderToken(
        new PropertyPairEntity(new TextEntity("title"), [
          new TextEntity("value"),
        ]),
      ),
    ).toContain("value");
    expect(
      renderToken(
        new BlockRefEntity("block-id", [new TextEntity("nested block")]),
      ),
    ).toContain("nested block");
    expect(
      renderToken(
        Object.assign(new CommandEntity("embed", ""), {
          resolvedContent: [new TextEntity("embedded")],
        }),
      ),
    ).toContain("embedded");
    expect(
      renderToken(
        Object.assign(new CommandQueryEntity(), {
          vlJsonStr: '{"mark":"bar"}',
          resolvedDataForVlJson: [{ label: "a", value: 1 }],
        }),
      ),
    ).toContain('id="vis"');
    expect(
      renderToken(
        Object.assign(new CommandQueryEntity(), {
          resolvedBlocks: [],
        }),
      ),
    ).toContain("CommandQuery");
    expect(
      renderToken(
        Object.assign(new CommandQueryEntity(), {
          resolvedBlocks: [{ answer: 1 }],
          queryExecutionMilliseconds: 7,
        }),
      ),
    ).toContain("1 results, execution time: 7 ms");
    expect(renderToken(new MarkerEntity("TODO"))).toContain("TODO");
  });

  test("skips disabled property keys and logs unknown tokens", () => {
    expect(
      renderToken(
        new PropertyPairEntity(new TextEntity("collapsed"), [
          new TextEntity("x"),
        ]),
      ),
    ).toBe("");

    const warnSpy = jest.spyOn(Logger, "logWarn").mockImplementation(() => {
      return;
    });

    expect(renderToken(new CommandEntity("unknown", ""))).toBe("");
    expect(warnSpy).toHaveBeenCalledWith("Unknown command name: unknown");

    expect(renderToken(new TokenEntity())).toBe("");
    expect(warnSpy).toHaveBeenCalledWith("Unknown token type:", "Token");
  });

  test("renders an empty marker when status is missing", () => {
    expect(renderToStaticMarkup(<MarkerComponent status={undefined} />)).toBe(
      "",
    );
  });
});

function renderToken(token: MarkdownToken): string {
  return renderToStaticMarkup(<TokenComponent token={token} />);
}

import {
  createToken,
  Image,
  Text,
  Heading,
  InlineCode,
  PageRef,
  CodeBlock,
  BlockRef,
  Command,
  CommandQuery,
  Link,
  PropertyPair,
  PropertyPairSeparator,
  Quote,
  ListStart,
  Newline,
  Marker,
} from "../token";
import { describe, expect, test } from "@jest/globals";

describe("createToken", () => {
  test("newline", () => {
    const obj = {
      type: 1,
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(new Newline());
  });

  test("image", () => {
    const obj = {
      type: 2,
      alt: "alt",
      src: "src",
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(new Image("src", "alt"));
  });

  test("liststart", () => {
    const obj = {
      type: 3,
      depth: 1,
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(new ListStart(1));
  });

  test("text", () => {
    const obj = {
      type: 4,
      textContent: "content",
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(new Text("content"));
  });

  test("PageRef", () => {
    const obj = {
      type: 5,
      title: "title",
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(new PageRef("title"));
  });

  test("Link", () => {
    const obj = {
      type: 6,
      title: "title",
      url: "url",
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(new Link("url", "title"));
  });

  test("PropertyPair", () => {
    const obj = {
      type: 7,
      key: {
        type: 4,
        textContent: "key",
      },
      value: [
        {
          type: 4,
          textContent: "value",
        },
      ],
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(
      new PropertyPair(new Text("key"), [new Text("value")]),
    );
  });

  test("heading", () => {
    const obj = {
      type: 8,
      level: 1,
      content: [
        {
          type: 4,
          textContent: "content",
        },
      ],
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(new Heading(1, [new Text("content")]));
  });

  test("Quote", () => {
    const obj = {
      type: 9,
      tokens: [{ type: 4, textContent: "content" }],
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(new Quote([new Text("content")]));
  });

  test("InlineCode", () => {
    const obj = {
      type: 10,
      textContent: "content",
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(new InlineCode("content"));
  });

  test("CodeBlock", () => {
    const obj = {
      type: 11,
      textContent: "content",
      lang: "lang",
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(new CodeBlock("content", "lang"));
  });

  test("PropertyPairSeparator", () => {
    const obj = {
      type: 12,
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(new PropertyPairSeparator());
  });

  describe("BlockRef", () => {
    test("without resolvedContent", () => {
      const obj = {
        type: 13,
        id: "id",
      };
      const token = createToken(obj);
      expect(token).toStrictEqual(new BlockRef("id"));
    });
    test("with resolvedContent", () => {
      const obj = {
        type: 13,
        id: "id",
        resolvedContent: [],
      };
      const token = createToken(obj);
      expect(token).toStrictEqual(new BlockRef("id", []));
    });
  });

  test("command", () => {
    const obj = {
      type: 14,
      name: "name",
      args: "args",
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(new Command("name", "args"));
  });

  test("commandquery", () => {
    const obj = {
      type: 15,
      query: '(property :status "done")',
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(new CommandQuery('(property :status "done")'));
    expect(token).toHaveProperty("resolvedBlocks", undefined);
  });

  test("commandquery with resolvedBlocks", () => {
    const obj = {
      type: 15,
      query: '(property :status "done")',
      resolvedBlocks: [{ depth: 1, children: [], content: [] }],
    };
    const token = createToken(obj);
    expect(token).toHaveProperty("query", '(property :status "done")');
    expect(token).toHaveProperty("resolvedBlocks", [
      { depth: 1, children: [], content: [] },
    ]);
  });

  test("marker", () => {
    const obj = {
      type: 16,
      status: "TODO",
    };
    const token = createToken(obj);
    expect(token).toStrictEqual(new Marker("TODO"));
  });

  test("unknown type", () => {
    const obj = {
      type: 100,
    };
    expect(() => createToken(obj)).toThrow('Unknown token type: {"type":100}');
  });
});

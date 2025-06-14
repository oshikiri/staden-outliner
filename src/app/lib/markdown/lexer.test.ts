import { describe, expect, test } from "@jest/globals";
import { Lexer } from "./lexer";
import {
  ListStart,
  Image,
  PageRef,
  Link,
  CodeBlock,
  Text,
  BlockRef,
  Quote,
  InlineCode,
  Heading,
  Newline,
  PropertyPairSeparator,
  Command,
  CommandQuery,
  Marker,
} from "./token";

describe("lexer", () => {
  describe("list item", () => {
    test("list items", () => {
      const lexer = new Lexer("- item1\n\t- item2\n\t\t- item3");
      const token = lexer.exec();
      expect(token).toEqual([
        new ListStart(1),
        new Text("item1"),
        new Newline(),
        new ListStart(2),
        new Text("item2"),
        new Newline(),
        new ListStart(3),
        new Text("item3"),
      ]);
    });
    test("list item with multi line", () => {
      const lexer = new Lexer("- item1\n  item1-2");
      const token = lexer.exec();
      expect(token).toEqual([
        new ListStart(1),
        new Text("item1"),
        new Newline(),
        new Text("item1-2"),
      ]);
    });
    test("non list item", () => {
      const lexer = new Lexer("this is - not list item");
      const token = lexer.exec();
      expect(token).toEqual([new Text("this is - not list item")]);
    });
    test("text ends with list item", () => {
      const lexer = new Lexer("\n-");
      const token = lexer.exec();
      expect(token).toEqual([new Newline(), new ListStart(1)]);
    });
  });
  describe("image", () => {
    test("normal img", () => {
      const lexer = new Lexer("![alt](srcurl)");
      const token = lexer.exec();
      expect(token).toEqual([new Image("srcurl", "alt")]);
    });
    test("img with sizes", () => {
      const lexer = new Lexer("![alt](srcurl){:height 426, :width 551}");
      const token = lexer.exec();
      expect(token).toEqual([new Image("srcurl", "alt", "551", "426")]);
    });
    test("img with sizes but only height", () => {
      const lexer = new Lexer("![alt](srcurl){:height 426}");
      const token = lexer.exec();
      expect(token).toEqual([new Image("srcurl", "alt", undefined, "426")]);
    });
    test("img with sizes", () => {
      const lexer = new Lexer("![alt](srcurl){:width 551}");
      const token = lexer.exec();
      expect(token).toEqual([new Image("srcurl", "alt", "551", undefined)]);
    });
  });

  describe("url", () => {
    test("raw url", () => {
      const lexer = new Lexer("https://example.com/");
      const token = lexer.exec();
      expect(token).toEqual([
        new Link("https://example.com/", "https://example.com/"),
      ]);
    });
    test("url with title", () => {
      const lexer = new Lexer("[title](https://example.com/)");
      const token = lexer.exec();
      expect(token).toEqual([new Link("https://example.com/", "title")]);
    });
    test("starts with `ht` but not url", () => {
      const lexer = new Lexer("https connection");
      const token = lexer.exec();
      expect(token).toEqual([new Text("https connection")]);
    });
    test("[title] normal text", () => {
      const lexer = new Lexer("[title] normal text");
      const token = lexer.exec();
      expect(token).toEqual([new Text("[title] normal text")]);
    });
  });

  describe("text with url", () => {
    test("text with url", () => {
      const lexer = new Lexer("text https://example.com/ text");
      const token = lexer.exec();
      expect(token).toEqual([
        new Text("text "),
        new Link("https://example.com/", "https://example.com/"),
        new Text(" text"),
      ]);
    });
  });

  describe("page ref", () => {
    describe("single page ref", () => {
      test("it convert to a single PageRef", () => {
        const lexer = new Lexer("[[page]]");
        const token = lexer.exec();
        expect(token).toEqual([new PageRef("page")]);
      });
    });

    describe("- [[pagename]] some text", () => {
      test("extract", () => {
        const lexer = new Lexer("- [[pagename]] some text");
        const token = lexer.exec();
        expect(token).toEqual([
          new ListStart(1),
          new PageRef("pagename"),
          new Text(" some text"),
        ]);
      });
    });

    describe("page ref after some string", () => {
      test("it convert to PageRef", () => {
        const lexer = new Lexer("a[[page]]");
        const token = lexer.exec();
        expect(token).toEqual([new Text("a"), new PageRef("page")]);
      });
    });

    describe("multiple page refs", () => {
      test("it also extracts the second ref", () => {
        const lexer = new Lexer("[[page1]]sometext[[page2]]");
        const token = lexer.exec();
        expect(token).toEqual([
          new PageRef("page1"),
          new Text("sometext"),
          new PageRef("page2"),
        ]);
      });
    });
  });

  describe("inline code", () => {
    test("inline code", () => {
      const lexer = new Lexer("`1+1`is 2");
      const token = lexer.exec();
      expect(token).toEqual([new InlineCode("1+1"), new Text("is 2")]);
    });
  });

  describe("code block", () => {
    test("code block", () => {
      const lexer = new Lexer("```\ncode block\n```");
      const token = lexer.exec();
      expect(token).toEqual([new CodeBlock("code block\n", "plaintext")]);
    });

    test("code block javascript", () => {
      const lexer = new Lexer("```javascript\ncode block\n```");
      const token = lexer.exec();
      expect(token).toEqual([new CodeBlock("code block\n", "javascript")]);
    });

    test("code block with head tabs", () => {
      const lexer = new Lexer("```\n\t\tcode block\n\t\t```");
      const token = lexer.exec();
      expect(token).toEqual([new CodeBlock("code block\n", "plaintext")]);
    });

    test("code block with backquote", () => {
      const lexer = new Lexer("```javascript\nconsole.log(`${x}`)\n```");
      const token = lexer.exec();
      expect(token).toEqual([
        new CodeBlock("console.log(`${x}`)\n", "javascript"),
      ]);
    });

    test("code block with depth 1", () => {
      const lexer = new Lexer("- ```javascript\n  code block\n  ```");
      const token = lexer.exec();
      expect(token).toEqual([
        new ListStart(1),
        new CodeBlock("code block\n", "javascript"),
      ]);
    });
  });

  describe("quote", () => {
    test("single line", () => {
      const lexer = new Lexer("> content");
      const token = lexer.exec();
      expect(token).toEqual([new Quote([]), new Text(" content")]);
    });
    test("multiple lines", () => {
      const lexer = new Lexer(">content1\n\t\t>content2");
      const token = lexer.exec();
      expect(token).toEqual([
        new Quote([]),
        new Text("content1"),
        new Newline(),
        new Quote([]),
        new Text("content2"),
      ]);
    });
  });

  describe("properties", () => {
    test("single properties", () => {
      const lexer = new Lexer("type:: book");
      const token = lexer.exec();
      expect(token).toEqual([
        new Text("type"),
        new PropertyPairSeparator(),
        new Text(" book"),
      ]);
    });
    test("value contains white spaces", () => {
      const lexer = new Lexer("type:: aaa bbb ccc");
      const token = lexer.exec();
      expect(token).toEqual([
        new Text("type"),
        new PropertyPairSeparator(),
        new Text(" aaa bbb ccc"),
      ]);
    });
    test("pageref", () => {
      const lexer = new Lexer("start:: [[2013-01-01]]");
      const token = lexer.exec();
      expect(token).toEqual([
        new Text("start"),
        new PropertyPairSeparator(),
        new Text(" "),
        new PageRef("2013-01-01"),
      ]);
    });
  });

  describe("heading", () => {
    describe("heading 1", () => {
      test("heading 1", () => {
        const lexer = new Lexer("# title");
        const token = lexer.exec();
        expect(token).toEqual([new Heading(1), new Text(" title")]);
      });
    });
    describe("### [[pageref]] ![alttext](imgurl)", () => {
      test("parses", () => {
        const lexer = new Lexer("### [[pageref]] ![alttext](imgurl)");
        const token = lexer.exec();
        expect(token).toEqual([
          new Heading(3),
          new Text(" "),
          new PageRef("pageref"),
          new Text(" "),
          new Image("imgurl", "alttext"),
        ]);
      });
    });
  });

  describe("marker", () => {
    test("TODO some text", () => {
      const lexer = new Lexer("TODO some text");
      const token = lexer.exec();
      expect(token).toEqual([new Marker("TODO"), new Text("some text")]);
    });
    test("TODO [[page]]", () => {
      const lexer = new Lexer("TODO [[page]]");
      const token = lexer.exec();
      expect(token).toEqual([new Marker("TODO"), new PageRef("page")]);
    });
    test("DOING with logbook", () => {
      const lexer = new Lexer(
        "DOING logbook\n:LOGBOOK:\nCLOCK:\n[2025-01-19 Sun 22:57:45]\n:END:",
      );
      const token = lexer.exec();
      expect(token).toEqual([
        new Marker("DOING"),
        new Text("logbook"),
        new Newline(),
        new Text(":LOGBOOK:"),
        new Newline(),
        new Text("CLOCK:"),
        new Newline(),
        new Text("[2025-01-19 Sun 22:57:45]"),
        new Newline(),
        new Text(":END:"),
      ]);
    });

    test("DONE with logbook", () => {
      const lexer = new Lexer("DONE done task");
      const token = lexer.exec();
      expect(token).toEqual([new Marker("DONE"), new Text("done task")]);
    });
  });

  describe("block ref", () => {
    test("block ref", () => {
      const lexer = new Lexer("((6794ba78-8c2a-4c52-9e57-edd34e67618f))");
      const token = lexer.exec();
      expect(token).toEqual([
        new BlockRef("6794ba78-8c2a-4c52-9e57-edd34e67618f"),
      ]);
    });
  });

  describe("custom command", () => {
    test("block embed", () => {
      const lexer = new Lexer(
        "{{embed ((6794ba78-8c2a-4c52-9e57-edd34e67618f))}}",
      );
      const token = lexer.exec();
      expect(token).toEqual([
        new Command("embed", "((6794ba78-8c2a-4c52-9e57-edd34e67618f))"),
      ]);
    });

    test("query table", () => {
      const lexer = new Lexer(
        '{{query (AND (property :status "doing") (property :type "book"))}}',
      );
      const token = lexer.exec();
      expect(token).toEqual([
        new CommandQuery(
          '(AND (property :status "doing") (property :type "book"))',
        ),
      ]);
    });
  });

  describe("multi line", () => {
    test("multi line", () => {
      const lexer = new Lexer("line1\nline2\nline3");
      const token = lexer.exec();
      expect(token).toEqual([
        new Text("line1"),
        new Newline(),
        new Text("line2"),
        new Newline(),
        new Text("line3"),
      ]);
    });
  });
});

import { beforeEach, describe, expect, jest, test } from "bun:test";
import { Block } from "@/shared/markdown";
import {
  CodeBlock,
  CommandQuery,
  Heading,
  Image,
} from "@/shared/markdown/token";
import * as Logger from "@/shared/logger";
import * as Sqlite from "@/server/lib/sqlite";

import { resolvePageContent } from "./contentResolver";

describe("contentResolver", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("resolvePageContent resolves image paths relative to the page file", async () => {
    const page = new Block(
      [
        new Image("./images/sample.png", "sample"),
        new Heading(1, [new Image("../assets/heading.png", "heading")]),
        new Image("https://example.com/remote.png", "remote"),
        new Image("data:image/png;base64,xxx", "inline"),
      ],
      0,
      [],
    );

    await resolvePageContent(page, {
      pageFilePath: "/vault/notes/nested/Page.md",
      stadenRoot: "/vault",
    });

    expect(page.content[0]).toHaveProperty(
      "src",
      "notes/nested/images/sample.png",
    );
    expect((page.content[1] as Heading).content[0]).toHaveProperty(
      "src",
      "notes/assets/heading.png",
    );
    expect(page.content[2]).toHaveProperty(
      "src",
      "https://example.com/remote.png",
    );
    expect(page.content[3]).toHaveProperty("src", "data:image/png;base64,xxx");
  });

  test("resolvePageContent logs a warning and ignores image paths outside STADEN_ROOT", async () => {
    const page = new Block([new Image("../../outside.png", "outside")], 0, []);
    const logWarnSpy = jest.spyOn(Logger, "logWarn").mockImplementation(() => {
      return;
    });

    await resolvePageContent(page, {
      pageFilePath: "/vault/notes/Page.md",
      stadenRoot: "/vault",
    });

    expect(page.content[0]).toHaveProperty("src", "../../outside.png");
    expect(logWarnSpy).toHaveBeenCalledWith(
      "Ignoring image path outside STADEN_ROOT",
      expect.objectContaining({
        src: "../../outside.png",
        imagePath: "/outside.png",
      }),
    );
  });

  test("resolvePageContent logs a warning when CommandQuery resolution fails", async () => {
    const page = new Block(
      [new CommandQuery(), new CodeBlock("select * from pages", "sql")],
      0,
      [],
    );
    page.withId("page-1");
    const getBlockByIdSpy = jest
      .spyOn(Sqlite, "getBlockById")
      .mockReturnValue(page);
    const getReadonlyDbSpy = jest
      .spyOn(Sqlite, "getReadonlyDb")
      .mockReturnValue({
        query: () => ({
          all: () => {
            throw new Error("query failed");
          },
        }),
      } as never);
    const logWarnSpy = jest.spyOn(Logger, "logWarn").mockImplementation(() => {
      return;
    });

    await resolvePageContent(page);

    expect(getBlockByIdSpy).toHaveBeenCalledWith("page-1");
    expect(getReadonlyDbSpy).toHaveBeenCalled();
    expect(logWarnSpy).toHaveBeenCalledWith(
      "Failed to resolve CommandQuery",
      expect.objectContaining({
        blockId: "page-1",
        error: expect.any(Error),
      }),
    );
    expect(page.content[0]).toBeInstanceOf(CommandQuery);
  });

  test("resolvePageContent logs a warning when CommandQuery is not read only", async () => {
    const page = new Block(
      [
        new CommandQuery(),
        new CodeBlock("insert into pages values (1)", "sql"),
      ],
      0,
      [],
    );
    page.withId("page-2");
    jest.spyOn(Sqlite, "getBlockById").mockReturnValue(page);
    const getReadonlyDbSpy = jest.spyOn(Sqlite, "getReadonlyDb");
    const logWarnSpy = jest.spyOn(Logger, "logWarn").mockImplementation(() => {
      return;
    });

    await resolvePageContent(page);

    expect(getReadonlyDbSpy).not.toHaveBeenCalled();
    expect(logWarnSpy).toHaveBeenCalledWith(
      "Failed to resolve CommandQuery",
      expect.objectContaining({
        blockId: "page-2",
        error: expect.any(Error),
      }),
    );
    expect(page.content[0]).toBeInstanceOf(CommandQuery);
  });

  test("resolvePageContent keeps sqlite rows as plain objects", async () => {
    const page = new Block(
      [
        new CommandQuery(),
        new CodeBlock("select 1 as answer", "sql"),
        new CodeBlock(
          "return Plot.plot({ marks: [Plot.dot([1, 2, 3])] });",
          "js",
        ),
      ],
      0,
      [],
    );
    page.withId("page-3");
    const sqlitePage = new Block(
      [
        new CommandQuery(),
        new CodeBlock("select 1 as answer", "sql"),
        new CodeBlock(
          "return Plot.plot({ marks: [Plot.dot([1, 2, 3])] });",
          "js",
        ),
      ],
      0,
      [],
    );
    sqlitePage.withId("page-3");
    jest.spyOn(Sqlite, "getBlockById").mockReturnValue(sqlitePage);
    jest.spyOn(Sqlite, "getReadonlyDb").mockReturnValue({
      query: () => ({
        all: () => [{ answer: 1 }],
      }),
    } as never);

    await resolvePageContent(page);

    const resolvedToken = page.content[0];
    expect(resolvedToken).toBeInstanceOf(CommandQuery);
    expect(resolvedToken).toHaveProperty("resolvedBlocks", [{ answer: 1 }]);
    expect(resolvedToken).toHaveProperty(
      "chartSource",
      "return Plot.plot({ marks: [Plot.dot([1, 2, 3])] });",
    );
  });

  test("resolvePageContent loads the regex_capture extension for matching queries", async () => {
    const page = new Block(
      [
        new CommandQuery(),
        new CodeBlock(
          `
            with versions as (
                select
                    regex_capture('v1.2.3:hello', 'v(\\\\d)\\\\.(\\\\d)\\\\.(\\\\d):(.+)') as cap
            )
            select
                cap ->> '$[0]' as major,
                cap ->> '$[1]' as minor,
                cap ->> '$[2]' as patch,
                cap ->> '$[3]' as description
            from versions
          `,
          "sql",
        ),
      ],
      0,
      [],
    );
    page.withId("page-regex-capture");
    jest.spyOn(Sqlite, "getBlockById").mockReturnValue(page);
    const ensureRegexCaptureExtensionLoadedSpy = jest
      .spyOn(Sqlite, "ensureRegexCaptureExtensionLoaded")
      .mockImplementation(() => undefined);
    jest.spyOn(Sqlite, "getReadonlyDb").mockReturnValue({
      query: () => ({
        all: () => [
          { major: "1", minor: "2", patch: "3", description: "hello" },
        ],
      }),
    } as never);

    await resolvePageContent(page);

    expect(ensureRegexCaptureExtensionLoadedSpy).toHaveBeenCalledTimes(1);
    expect(page.content[0]).toBeInstanceOf(CommandQuery);
    expect(page.content[0]).toHaveProperty("resolvedBlocks", [
      { major: "1", minor: "2", patch: "3", description: "hello" },
    ]);
  });

  test("resolvePageContent ignores non-javascript chart source blocks", async () => {
    const page = new Block(
      [
        new CommandQuery(),
        new CodeBlock("select 1 as answer", "sql"),
        new CodeBlock("return Plot.plot({ marks: [] });", "json"),
      ],
      0,
      [],
    );
    page.withId("page-4");
    const sqlitePage = new Block(
      [
        new CommandQuery(),
        new CodeBlock("select 1 as answer", "sql"),
        new CodeBlock("return Plot.plot({ marks: [] });", "json"),
      ],
      0,
      [],
    );
    sqlitePage.withId("page-4");
    jest.spyOn(Sqlite, "getBlockById").mockReturnValue(sqlitePage);
    jest.spyOn(Sqlite, "getReadonlyDb").mockReturnValue({
      query: () => ({
        all: () => [{ answer: 1 }],
      }),
    } as never);

    await resolvePageContent(page);

    const resolvedToken = page.content[0];
    expect(resolvedToken).toBeInstanceOf(CommandQuery);
    expect(resolvedToken).toHaveProperty("resolvedBlocks", [{ answer: 1 }]);
    expect(resolvedToken).toHaveProperty("chartSource", undefined);
  });

  test("resolvePageContent allows chart-only plot blocks", async () => {
    const page = new Block(
      [new CommandQuery(undefined, undefined, undefined, true)],
      0,
      [],
    );
    page.withId("page-6");
    page.content = [
      new CommandQuery(undefined, undefined, undefined, true),
      new CodeBlock(
        `const marks = [1, 2, 3];
return Plot.plot({ marks: [Plot.dot(marks)] });`,
        "js",
      ),
    ];
    jest.spyOn(Sqlite, "getBlockById").mockReturnValue(page);
    const getReadonlyDbSpy = jest.spyOn(Sqlite, "getReadonlyDb");

    await resolvePageContent(page);

    const resolvedToken = page.content[0];
    expect(resolvedToken).toBeInstanceOf(CommandQuery);
    expect(getReadonlyDbSpy).not.toHaveBeenCalled();
    expect(resolvedToken).toHaveProperty("resolvedBlocks", undefined);
    expect(resolvedToken).toHaveProperty(
      "chartSource",
      `const marks = [1, 2, 3];
return Plot.plot({ marks: [Plot.dot(marks)] });`,
    );
  });

  test("resolvePageContent resolves observable plot charts from child blocks", async () => {
    const child = new Block(
      [new CommandQuery(undefined, undefined, undefined, true)],
      1,
      [new Block([], 2, [])],
    );
    child.withId("page-7-child");
    child.children[0].content = [
      new CodeBlock(
        `const marks = [1, 2, 3];
return Plot.plot({ marks: [Plot.dot(marks)] });`,
        "js",
      ),
    ];
    child.children[0].withId("page-7-grandchild");
    const page = new Block([], 0, [child]).withId("page-7");
    child.parent = page;
    child.children[0].parent = child;

    jest.spyOn(Sqlite, "getBlockById").mockImplementation((id) => {
      return id === "page-7-child" ? child : page;
    });

    await resolvePageContent(page);

    const resolvedToken = child.content[0];
    expect(resolvedToken).toBeInstanceOf(CommandQuery);
    expect(resolvedToken).toHaveProperty(
      "chartSource",
      `const marks = [1, 2, 3];
return Plot.plot({ marks: [Plot.dot(marks)] });`,
    );
  });

  test("resolvePageContent reads chart source from a child with descendants", async () => {
    const child = new Block(
      [
        new CommandQuery(undefined, undefined, undefined, true),
        new CodeBlock(
          `const marks = [1, 2, 3];
return Plot.plot({ marks: [Plot.dot(marks)] });`,
          "js",
        ),
      ],
      1,
      [new Block([], 2, [])],
    );
    child.withId("page-9-child");
    const page = new Block([], 0, [child]).withId("page-9");
    child.parent = page;
    child.children[0].parent = child;

    jest.spyOn(Sqlite, "getBlockById").mockImplementation((id) => {
      return id === "page-9-child" ? child : page;
    });

    await resolvePageContent(page);

    const resolvedToken = child.content[0];
    expect(resolvedToken).toBeInstanceOf(CommandQuery);
    expect(resolvedToken).toHaveProperty(
      "chartSource",
      `const marks = [1, 2, 3];
return Plot.plot({ marks: [Plot.dot(marks)] });`,
    );
  });

  test("resolvePageContent ignores chart source blocks in grandchild blocks", async () => {
    const child = new Block([new CommandQuery()], 1, [
      new Block(
        [
          new CodeBlock(
            `const marks = [1, 2, 3];
return Plot.plot({ marks: [Plot.dot(marks)] });`,
            "js",
          ),
        ],
        2,
        [],
      ),
    ]);
    child.withId("page-8-child");
    const page = new Block([], 0, [child]).withId("page-8");
    child.parent = page;
    child.children[0].parent = child;

    jest.spyOn(Sqlite, "getBlockById").mockImplementation((id) => {
      return id === "page-8-child" ? child : page;
    });

    await resolvePageContent(page);

    const resolvedToken = child.content[0];
    expect(resolvedToken).toBeInstanceOf(CommandQuery);
    expect(resolvedToken).toHaveProperty("resolvedBlocks", undefined);
    expect(resolvedToken).toHaveProperty("chartSource", undefined);
  });
});

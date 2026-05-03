import { beforeEach, describe, expect, jest, test } from "bun:test";
import { Block } from "@/shared/markdown";
import { CodeBlock, CommandQuery } from "@/shared/markdown/token";
import * as Logger from "@/shared/logger";
import * as Sqlite from "@/server/lib/sqlite";

import { resolvePageContent } from "./contentResolver";

describe("contentResolver", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
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

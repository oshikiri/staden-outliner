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
    const page = new Block([new CommandQuery("{{query}}")], 0, []).withId(
      "page-1",
    );
    const queryChild = new Block(
      [new CodeBlock("select * from pages", "sql")],
      2,
      [],
    ).withId("query-child");
    const queryBlock = new Block([], 1, [queryChild]).withId("query-block");
    queryChild.withParent(queryBlock);
    const getBlockByIdSpy = jest
      .spyOn(Sqlite, "getBlockById")
      .mockResolvedValue(queryBlock);
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
    const page = new Block([new CommandQuery("{{query}}")], 0, []).withId(
      "page-2",
    );
    const queryChild = new Block(
      [new CodeBlock("insert into pages values (1)", "sql")],
      2,
      [],
    ).withId("query-child");
    const queryBlock = new Block([], 1, [queryChild]).withId("query-block");
    queryChild.withParent(queryBlock);
    jest.spyOn(Sqlite, "getBlockById").mockResolvedValue(queryBlock);
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
});

import { describe, expect, test } from "@jest/globals";
import { Block } from "../../block";
import { Token, Text, ListStart } from "../../token";
import { Parser } from "../../parser";

describe("others", () => {
  test("it", () => {
    const tokens: Token[] = [new Text("content1")];
    const parser = new Parser(tokens);
    const rootListitem = parser.parse();
    expect(rootListitem).toEqual(
      new Block([], 0, [
        new Block([new ListStart(1), new Text("content1")], 1, []),
      ]),
    );
  });
});

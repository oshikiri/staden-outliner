import { describe, expect, test } from "@jest/globals";
import { Block } from "../../block";
import { ListStart, Newline, Quote, Text } from "../../token";
import { Parser } from "../../parser";

describe("quote", () => {
  test("it concats consecutive quote", () => {
    const tokens = [
      new ListStart(1),
      new Quote([]),
      new Text("content1"),
      new Newline(),
      new Quote([]),
      new Text("content2"),
    ];
    const parser = new Parser(tokens);
    const rootListitem = parser.parse();
    expect(rootListitem).toEqual(
      new Block([], 0, [
        new Block(
          [
            new Quote([
              new Text("content1"),
              new Newline(),
              new Text("content2"),
            ]),
          ],
          1,
          [],
        ),
      ]),
    );
  });
  test("it do not concats Text and Quote", () => {
    const tokens = [
      new ListStart(1),
      new Text("content1"),
      new Newline(),
      new Quote([]),
      new Text("content2"),
    ];
    const parser = new Parser(tokens);
    const rootListitem = parser.parse();
    expect(rootListitem).toEqual(
      new Block([], 0, [
        new Block(
          [
            new Text("content1"),
            new Newline(),
            new Quote([new Text("content2")]),
          ],
          1,
          [],
        ),
      ]),
    );
  });
});

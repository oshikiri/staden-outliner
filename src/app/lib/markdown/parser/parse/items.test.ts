import { describe, expect, test } from "@jest/globals";
import { ListStart, Text } from "./../../token";
import { Parser } from "./../../parser";
import { Block } from "../../block";

describe("items", () => {
  test("items flat", () => {
    const token = [
      new ListStart(1),
      new Text("item1"),
      new ListStart(1),
      new Text("item2"),
      new ListStart(1),
      new Text("item3"),
    ];
    const parser = new Parser(token);
    const listItem = parser.parse();
    expect(listItem).toEqual(
      new Block([], 0, [
        new Block([new Text("item1")], 1, []),
        new Block([new Text("item2")], 1, []),
        new Block([new Text("item3")], 1, []),
      ]),
    );
  });
  test("items depth1", () => {
    const token = [
      new ListStart(1),
      new Text("item1"),
      new ListStart(2),
      new Text("item2"),
      new ListStart(1),
      new Text("item3"),
    ];
    const parser = new Parser(token);
    const listItem = parser.parse();
    expect(listItem).toEqual(
      new Block([], 0, [
        new Block([new Text("item1")], 1, [
          new Block([new Text("item2")], 2, []),
        ]),
        new Block([new Text("item3")], 1, []),
      ]),
    );
  });
  test("items depth2", () => {
    const token = [
      new ListStart(1),
      new Text("item1"),
      new ListStart(2),
      new Text("item1-1"),
      new ListStart(3),
      new Text("item1-1-1"),
      new ListStart(3),
      new Text("item1-1-2"),
      new ListStart(2),
      new Text("item1-2"),
    ];
    const parser = new Parser(token);
    const listItem = parser.parse();
    expect(listItem).toEqual(
      new Block([], 0, [
        new Block([new Text("item1")], 1, [
          new Block([new Text("item1-1")], 2, [
            new Block([new Text("item1-1-1")], 3, []),
            new Block([new Text("item1-1-2")], 3, []),
          ]),
          new Block([new Text("item1-2")], 2, []),
        ]),
      ]),
    );
  });
});

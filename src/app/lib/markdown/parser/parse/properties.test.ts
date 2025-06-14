import { describe, expect, test } from "@jest/globals";
import { Block } from "../../block";
import {
  Token,
  Text,
  ListStart,
  PropertyPair,
  PropertyPairSeparator,
  Newline,
} from "../../token";
import { Parser } from "../../parser";

describe("properties", () => {
  test("it", () => {
    const tokens: Token[] = [new PropertyPairSeparator()];
    const parser = new Parser(tokens);
    const rootListitem = parser.parse();
    expect(rootListitem).toEqual(
      new Block([], 0, [new Block([new Text("::")], 1, [])]),
    );
  });

  test("collapsed:: true", () => {
    const tokens: Token[] = [
      new Text("collapsed"),
      new PropertyPairSeparator(),
      new Text("true"),
    ];
    const parser = new Parser(tokens);
    const rootListitem = parser.parse();
    const item = new Block(
      [
        new ListStart(1),
        new PropertyPair(new Text("collapsed"), [new Text("true")]),
      ],
      1,
      [],
    );
    item.properties = item.properties || [];
    item.properties.push(["collapsed", "true"]);
    expect(rootListitem).toEqual(new Block([], 0, [item]));
    expect(rootListitem.children[0].properties).toEqual([
      ["collapsed", "true"],
    ]);
  });

  test("predefined block id", () => {
    const tokens: Token[] = [
      new ListStart(1),
      new Text("content"),
      new Newline(),
      new Text("id"),
      new PropertyPairSeparator(),
      new Text("679a1868-6de6-437b-8ff2-2d58d4bb50cc"),
    ];
    const parser = new Parser(tokens);
    const rootListitem = parser.parse();

    const expectedChild = new Block(
      [
        new Text("content"),
        new Newline(),
        new PropertyPair(new Text("id"), [
          new Text("679a1868-6de6-437b-8ff2-2d58d4bb50cc"),
        ]),
      ],
      1,
      [],
    );
    expectedChild.id = "679a1868-6de6-437b-8ff2-2d58d4bb50cc";
    expectedChild.properties = expectedChild.properties || [];
    expectedChild.properties.push([
      "id",
      "679a1868-6de6-437b-8ff2-2d58d4bb50cc",
    ]);
    const expected = new Block([], 0, [expectedChild]);

    expect(rootListitem).toEqual(expected);
    const child = rootListitem.children[0];
    expect(child.properties).toEqual([
      ["id", "679a1868-6de6-437b-8ff2-2d58d4bb50cc"],
    ]);
  });

  test("property", () => {
    const tokens = [
      new ListStart(1),
      new Text("item1"),
      new PropertyPairSeparator(),
      new Text("value1"),
      new Newline(),
      new Text("item2"),
      new PropertyPairSeparator(),
      new Text("value2"),
      new Newline(),
    ];
    const parser = new Parser(tokens);
    const listItem = parser.parse();
    const item = new Block(
      [
        new PropertyPair(new Text("item1"), [new Text("value1")]),
        new PropertyPair(new Text("item2"), [new Text("value2")]),
      ],
      1,
      [],
    );
    item.properties = [
      ["item1", "value1"],
      ["item2", "value2"],
    ];
    expect(listItem).toEqual(new Block([], 0, [item]));
  });
});

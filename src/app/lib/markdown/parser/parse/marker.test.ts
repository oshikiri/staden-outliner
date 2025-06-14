import { describe, expect, test } from "@jest/globals";
import { ListStart, Text, Marker } from "./../../token";
import { Parser } from "./../../parser";
import { Block } from "../../block";

describe("marker", () => {
  test("markers", () => {
    const token = [
      new ListStart(1),
      new Marker("TODO"),
      new Text("item1"),
      new ListStart(1),
      new Marker("DOING"),
      new Text("item2"),
      new ListStart(1),
      new Marker("DONE"),
      new Text("item3"),
    ];
    const parser = new Parser(token);
    const listItem = parser.parse();
    expect(listItem).toEqual(
      new Block([], 0, [
        new Block([new Marker("TODO"), new Text("item1")], 1, []),
        new Block([new Marker("DOING"), new Text("item2")], 1, []),
        new Block([new Marker("DONE"), new Text("item3")], 1, []),
      ]),
    );
  });
});

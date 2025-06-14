import { describe, expect, test } from "@jest/globals";
import { Block } from "../../block";
import { ListStart, Text, Marker } from "../../token";
import { Parser } from "../../parser";

describe("logbook", () => {
  test("todo with logbook", () => {
    const tokens = [
      new ListStart(1),
      new Marker("TODO"),
      new Text("todoitem"),
      new Text(":LOGBOOK:"),
      new Text("CLOCK:"),
      new Text(":END:"),
    ];
    const parser = new Parser(tokens);
    const rootListitem = parser.parse();
    expect(rootListitem).toEqual(
      new Block([], 0, [
        new Block([new Marker("TODO"), new Text("todoitem")], 1, []),
      ]),
    );
  });
});

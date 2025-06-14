import { describe, expect, test } from "@jest/globals";
import { ListStart, Text, Heading } from "./../../token";
import { Parser } from "./../../parser";
import { Block } from "../../block";

describe("heading", () => {
  test("with linestart", () => {
    const token = [new ListStart(1), new Heading(1), new Text("TODO item")];
    const parser = new Parser(token);
    const listItem = parser.parse();
    expect(listItem).toEqual(
      new Block([], 0, [
        new Block([new Heading(1, [new Text("TODO item")])], 1, []),
      ]),
    );
  });
  test("without linestart", () => {
    const token = [new Heading(1), new Text("item")];
    const parser = new Parser(token);
    const listItem = parser.parse();
    expect(listItem).toEqual(
      new Block([], 0, [
        new Block([new Heading(1, [new Text("item")])], 1, []),
      ]),
    );
  });
});

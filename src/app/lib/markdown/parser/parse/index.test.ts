import { describe, expect, test } from "@jest/globals";
import { Block } from "../../block";
import { ListStart, Newline } from "../../token";
import { Parser } from "../../parser";

describe("parse", () => {
  test("newline", () => {
    const token = [new Newline()];
    const parser = new Parser(token);
    const listItem = parser.parse();
    expect(listItem).toEqual(new Block([], 0, []));
  });
  test("liststart", () => {
    const token = [new ListStart(1)];
    const parser = new Parser(token);
    const listItem = parser.parse();
    expect(listItem).toEqual(new Block([], 0, [new Block([], 1, [])]));
  });
});

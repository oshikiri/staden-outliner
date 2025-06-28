import { describe, expect, test } from "@jest/globals";
import { ListStart, Text } from "../../token";
import { Parser } from "../../parser";

describe("invalid input tokens", () => {
  test("it raises an error", () => {
    const tokens = [new ListStart(0), new Text("text")];
    const parser = new Parser(tokens);
    expect(() => parser.parse()).toThrow();
  });
});

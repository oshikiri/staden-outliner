import { Newline, Token } from "../token";
import { describe, expect, test } from "@jest/globals";

describe("Token", () => {
  test("returns an empty string", () => {
    const token = new Token();
    expect(token.toMarkdown()).toBe("");
  });

  test("newline", () => {
    const newline = new Newline();
    expect(newline.toMarkdown()).toBe("\n");
  });

  test("newline toText", () => {
    const newline = new Newline();
    expect(newline.toText()).toBe("");
  });
});

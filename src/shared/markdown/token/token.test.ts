import {
  CodeBlock,
  InlineCode,
  Newline,
  Text,
  Token,
  TokenType,
  isTokenType,
} from "../token";
import { describe, expect, test } from "bun:test";

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

  test("text-like tokens expose plain text", () => {
    expect(new Text("plain").toText()).toBe("plain");
    expect(new InlineCode("inline").toText()).toBe("inline");
    expect(new CodeBlock("code", "ts").toText()).toBe("code");
  });

  test("isTokenType excludes the internal base token type", () => {
    expect(isTokenType(TokenType.Base)).toBe(false);
    expect(isTokenType(TokenType.Text)).toBe(true);
  });
});

import { describe, it, expect } from "bun:test";
import { parse, Block } from "./index";

describe("parse", () => {
  it("return a Block instance", () => {
    const markdown = "# Heading\n\nParagraph text.";
    const result = parse(markdown);
    expect(result).toBeInstanceOf(Block);
  });
});

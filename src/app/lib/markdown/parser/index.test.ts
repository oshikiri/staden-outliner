import { describe, expect, test } from "@jest/globals";
import {
  Text,
  Heading,
  PropertyPairSeparator,
  Quote,
  Newline,
  Marker,
} from "../token";
import { Parser } from "../parser";
import { Block } from "../block";

describe("Parser", () => {
  describe("collapseTailUntil", () => {
    test("collapse", () => {
      const tokens = [
        new Block([new Text("item0")], 0, []),
        new Block([new Text("item1-1")], 1, []),
        new Block([new Text("item1-2")], 1, []),
      ];
      const parser = new Parser([]);
      const collapsed = parser.collapseTailUntil(tokens, 0);
      expect(collapsed).toEqual([
        new Block([new Text("item0")], 0, [
          new Block([new Text("item1-1")], 1, []),
          new Block([new Text("item1-2")], 1, []),
        ]),
      ]);
    });
    test("when stack = [] returns []", () => {
      const parser = new Parser([]);
      const collapsed = parser.collapseTailUntil([], 0);
      expect(collapsed).toEqual([]);
    });

    test("when stack = [item0]", () => {
      const tokens = [new Block([new Text("item0")], 1, [])];
      const parser = new Parser([]);
      const collapsed = parser.collapseTailUntil(tokens, 0);
      expect(collapsed).toEqual([new Block([new Text("item0")], 1, [])]);
    });

    test("when tokens content newline, it removes newline", () => {
      const stack = [
        new Block([], 0, []),
        new Block([new Text("item1"), new Newline()], 1, []),
      ];
      const parser = new Parser([]);
      const collapsed = parser.collapseTailUntil(stack, 0);
      expect(collapsed).toEqual([
        new Block([], 0, [new Block([new Text("item1")], 1, [])]),
      ]);
    });

    test("it throws an error if stack is invalid", () => {
      const tokens = [
        new Block([new Text("item2")], 2, []),
        new Block([new Text("item3")], 2, []),
      ];
      const parser = new Parser([]);
      expect(() => parser.collapseTailUntil(tokens, 1)).toThrowError();
    });
  });

  describe("consumeNewline", () => {
    test("when stack is empty, it do nothing", () => {
      const tokens = [new Newline()];
      const parser = new Parser(tokens);
      const i = parser.consumeNewline(0);
      expect(i).toBe(1);
      expect(parser.stack).toHaveLength(0);
    });
  });

  describe("consumeQuote", () => {
    test("it consumes", () => {
      const tokens = [new Quote([]), new Text("text1")];
      const parser = new Parser(tokens);
      const i = parser.consumeQuote(0);
      expect(i).toBe(2); // it consumes tokens[0] and [1], so next is 2
      expect(parser.stack).toEqual([
        new Block([new Quote([new Text("text1")])], 0, []),
      ]);
    });
  });

  describe("consumeHeading", () => {
    test("if stack is empty", () => {
      const tokens = [new Heading(1)];
      const parser = new Parser(tokens);
      const i = parser.consumeHeading(0, tokens[0]);
      expect(i).toBe(2);
      expect(parser.stack).toEqual([new Block([new Heading(1)], 1, [])]);
    });
  });

  describe("consumePropertyPair", () => {
    test("if stack is empty", () => {
      const tokens = [new PropertyPairSeparator()];
      const parser = new Parser(tokens);
      const i = parser.consumePropertyPair(0);
      expect(i).toBe(1);
      expect(parser.stack).toEqual([
        new Block([], 0, [new Block([new Text("::")], 1, [])]),
      ]);
    });
  });

  describe("consumeMarker", () => {
    test("when stack is empty, it raises an error", () => {
      const tokens = [new Newline()];
      const parser = new Parser(tokens);
      expect(() => parser.consumeMarker(0, new Marker("TODO"))).toThrowError();
    });
  });

  describe("consumeOthers", () => {
    test("if stack is empty", () => {
      const tokens = [new Text("content")];
      const parser = new Parser(tokens);
      expect(() => parser.consumeOthers(0, tokens[0])).toThrowError();
    });
  });
});

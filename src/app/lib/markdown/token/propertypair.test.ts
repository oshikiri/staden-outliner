import { PropertyPair, Text } from "../token";
import { describe, expect, test } from "@jest/globals";

describe("PropertyPair", () => {
  describe("toMarkdown", () => {
    test("returns property markdown", () => {
      const propertyPair = new PropertyPair(new Text("status"), [
        new Text("done"),
      ]);
      expect(propertyPair.toMarkdown()).toBe("status:: done\n");
    });
  });
  describe("toPair", () => {
    test("returns [key, value]", () => {
      const propertyPair = new PropertyPair(new Text("status"), [
        new Text("done"),
      ]);
      expect(propertyPair.toPair()).toEqual(["status", "done"]);
    });
  });
});

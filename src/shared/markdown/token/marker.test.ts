import { Marker } from "../token";
import { describe, expect, test } from "bun:test";

describe("Marker", () => {
  describe("toMarkdown", () => {
    test("appends ` ` to the tail", () => {
      const marker = new Marker("TODO");
      expect(marker.toMarkdown()).toBe("TODO ");
    });
  });
});

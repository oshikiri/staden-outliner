import { Marker } from "../token";
import { describe, expect, test } from "@jest/globals";

describe("Marker", () => {
  describe("toMarkdown", () => {
    test("appends ` ` to the tail", () => {
      const marker = new Marker("TODO");
      expect(marker.toMarkdown()).toBe("TODO ");
    });
  });
});

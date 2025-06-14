import { PageRef } from "../token";
import { describe, expect, test } from "@jest/globals";

describe("PageRef", () => {
  describe("toMarkdown", () => {
    test("returns pageref markdown", () => {
      const pageRef = new PageRef("page name");
      expect(pageRef.toMarkdown()).toBe("[[page name]]");
    });
  });
  describe("toText", () => {
    test("returns pageref title", () => {
      const pageRef = new PageRef("page name");
      expect(pageRef.toText()).toBe("page name");
    });
  });
});

import { Image } from "../token";
import { describe, expect, test } from "@jest/globals";

describe("Image", () => {
  describe("toMarkdown", () => {
    test("without size options", () => {
      const image = new Image("path/to/image.png", "alt text");
      expect(image.toMarkdown()).toBe("![alt text](path/to/image.png)");
    });

    test("with height option", () => {
      const image = new Image(
        "path/to/image.png",
        "alt text",
        undefined,
        "200px",
      );
      expect(image.toMarkdown()).toBe(
        "![alt text](path/to/image.png){:height 200px}",
      );
    });

    test("with width option", () => {
      const image = new Image("path/to/image.png", "alt text", "100px");
      expect(image.toMarkdown()).toBe(
        "![alt text](path/to/image.png){:width 100px}",
      );
    });

    test("with both size options", () => {
      const image = new Image(
        "path/to/image.png",
        "alt text",
        "100px",
        "200px",
      );
      expect(image.toMarkdown()).toBe(
        "![alt text](path/to/image.png){:height 200px, :width 100px}",
      );
    });
  });
});

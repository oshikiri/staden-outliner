import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import {
  isMultiLineMode,
  MarkdownEditView,
  toggleExplicitMultiLine,
} from "./MarkdownEditView";

describe("MarkdownEditView", () => {
  test("renders the editor mount point for the block", () => {
    const markup = renderToStaticMarkup(
      <MarkdownEditView
        blockId="block-1"
        initialMarkdown="hello"
        onBlur={() => {}}
      />,
    );

    expect(markup).toContain('data-block-id="block-1"');
  });
});

describe("CodeMirror edit mode rules", () => {
  test("uses multi-line mode when markdown contains a newline", () => {
    expect(isMultiLineMode("one\ntwo", false)).toBe(true);
  });

  test("uses multi-line mode when it is explicitly enabled", () => {
    expect(isMultiLineMode("one", true)).toBe(true);
  });

  test("toggles explicit multi-line mode back only when the document has no newline", () => {
    expect(toggleExplicitMultiLine("one", false)).toBe(true);
    expect(toggleExplicitMultiLine("one", true)).toBe(false);
    expect(toggleExplicitMultiLine("one\ntwo", true)).toBe(true);
  });
});

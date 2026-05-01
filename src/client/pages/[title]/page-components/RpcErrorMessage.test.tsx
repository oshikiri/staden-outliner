import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { RpcErrorMessage } from "./RpcErrorMessage";

describe("RpcErrorMessage", () => {
  test("renders the title and message in an alert region", () => {
    const markup = renderToStaticMarkup(
      <RpcErrorMessage title="Failed to save content" message="boom" />,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Failed to save content");
    expect(markup).toContain("boom");
  });
});

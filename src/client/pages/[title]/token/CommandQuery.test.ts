import { describe, expect, test } from "bun:test";

import { runCommandQueryChartSource } from "./CommandQuery";

describe("CommandQuery chart execution", () => {
  test("passes data into chart source", () => {
    const value = runCommandQueryChartSource(
      `
if (data[0].answer !== 42) {
  throw new Error("data were not passed through");
}
return data[0].answer;
`,
      [{ answer: 42 }],
    );

    expect(value).toBe(42);
  });
});

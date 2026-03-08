import { describe, expect, test } from "@jest/globals";
import { chunk } from "./lodash";

describe("chunk", () => {
  test("sizeごとに配列を分割できる", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  test("入力配列が空の場合は空配列を返す", () => {
    expect(chunk([], 3)).toEqual([]);
  });

  test("size が 1 未満の場合は空配列を返す", () => {
    expect(chunk([1, 2, 3], 0)).toEqual([]);
    expect(chunk([1, 2, 3], -1)).toEqual([]);
  });

  test("ジェネリクスでオブジェクト配列も扱える", () => {
    const input = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(chunk(input, 2)).toEqual([
      [{ id: "a" }, { id: "b" }],
      [{ id: "c" }],
    ]);
  });
});

import { describe, expect, test } from "@jest/globals";
import { chunk } from "./lodash";

describe("chunk", () => {
  test("sizeごとに配列を分割できる", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  test("size が配列長を超える場合は1チャンクだけ返す", () => {
    expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  test("入力配列が空の場合は空配列を返す", () => {
    expect(chunk([], 3)).toEqual([]);
  });

  test("size が正の整数でない場合は TypeError を投げる", () => {
    expect(() => chunk([1, 2, 3], 0)).toThrow(
      new TypeError("chunk size must be a positive integer"),
    );
    expect(() => chunk([1, 2, 3], -1)).toThrow(
      new TypeError("chunk size must be a positive integer"),
    );
    expect(() => chunk([1, 2, 3], 1.5)).toThrow(
      new TypeError("chunk size must be a positive integer"),
    );
  });

  test("ジェネリクスでオブジェクト配列も扱える", () => {
    const input = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(chunk(input, 2)).toEqual([
      [{ id: "a" }, { id: "b" }],
      [{ id: "c" }],
    ]);
  });
});

import { describe, expect, jest, mock, test } from "bun:test";

const getAllConfigsMock = jest.fn();

mock.module("@/server/lib/file/config", () => ({
  getAllConfigs: getAllConfigsMock,
}));

import { honoApiApp } from "@/server/api/app";

describe("api/app cors", () => {
  test("allows the localhost origin by default", async () => {
    getAllConfigsMock.mockResolvedValue({});

    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/configs", {
        headers: {
          Origin: "http://localhost:3000",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000",
    );
  });

  test("rejects other origins", async () => {
    getAllConfigsMock.mockResolvedValue({});

    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/configs", {
        headers: {
          Origin: "http://evil.example",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

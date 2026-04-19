import { beforeEach, describe, expect, jest, test } from "bun:test";

import * as ConfigFile from "@/app/lib/file/config";

import { honoApiApp } from "@/app/api/hono/app";

jest.mock("@/app/lib/file/config", () => ({
  getAllConfigs: jest.fn(),
}));

describe("api/configs/route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET returns configs as json", async () => {
    const getAllConfigsMock = ConfigFile.getAllConfigs;
    getAllConfigsMock.mockResolvedValue({
      favorites: ["index", "daily"],
    });

    const response = await honoApiApp.fetch(
      new Request("http://localhost/api/configs"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({
      favorites: ["index", "daily"],
    });
  });
});

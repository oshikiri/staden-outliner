import {
  afterAll,
  beforeEach,
  describe,
  expect,
  jest,
  mock,
  test,
} from "bun:test";

const getAllConfigsMock = jest.fn();

mock.module("@/server/lib/file/config", () => ({
  getAllConfigs: getAllConfigsMock,
}));

import { honoApiApp } from "@/server/api/app";

describe("api/configs/route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET returns configs as json", async () => {
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

afterAll(() => {
  mock.restore();
});

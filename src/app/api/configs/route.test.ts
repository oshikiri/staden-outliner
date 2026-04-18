import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import * as ConfigFile from "@/app/lib/file/config";

import { GET } from "./route";

jest.mock("@/app/lib/file/config", () => ({
  getAllConfigs: jest.fn(),
}));

describe("api/configs/route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET returns configs as json", async () => {
    const getAllConfigsMock = jest.mocked(ConfigFile.getAllConfigs);
    getAllConfigsMock.mockResolvedValue({
      favorites: ["index", "daily"],
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({
      favorites: ["index", "daily"],
    });
  });
});

import { describe, expect, test } from "@jest/globals";
import { StadenDate } from ".";

describe("Date", () => {
  test("format", () => {
    const date = new StadenDate("2023-01-23");
    expect(date.format()).toBe("2023-01-23");
  });

  test("daysInMonth", () => {
    const date = new StadenDate("2023-01-23");
    expect(date.daysInMonth()).toBe(31);
  });

  test("dayOfWeek", () => {
    const date = new StadenDate("2023-01-23");
    expect(date.dayOfWeek()).toBe(1); // Monday
  });

  describe("add", () => {
    test("add 3 years", () => {
      const date = new StadenDate("2023-01-23");
      const newDate = date.add(3, "year");
      expect(newDate.format()).toBe("2026-01-23");
    });
    test("add 2 months", () => {
      const date = new StadenDate("2023-01-23");
      const newDate = date.add(2, "month");
      expect(newDate.format()).toBe("2023-03-23");
    });
    test("add 5 days", () => {
      const date = new StadenDate("2023-01-23");
      const newDate = date.add(5, "day");
      expect(newDate.format()).toBe("2023-01-28");
    });
    test("add invalid unit", () => {
      const date = new StadenDate("2023-01-23");
      expect(() => date.add(5, "invalid")).toThrow(
        "Unknown manipulate type: invalid",
      );
    });
  });

  test("subtract", () => {
    const date = new StadenDate("2023-01-23");
    const newDate = date.add(-5, "day");
    expect(newDate.format()).toBe("2023-01-18");
  });
});

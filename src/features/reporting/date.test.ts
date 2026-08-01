import { describe, expect, it } from "vitest";

import {
  datesInRange,
  getInsightRange,
  getMonthRange,
  normalizeMonthKey,
  shiftMonthKey,
} from "@/features/reporting/date";

describe("reporting calendar dates", () => {
  it("builds a stable six-week Sunday-first grid", () => {
    expect(getMonthRange("2026-08")).toEqual({
      gridEnd: "2026-09-05",
      gridStart: "2026-07-26",
      monthEnd: "2026-08-31",
      monthStart: "2026-08-01",
    });
    expect(datesInRange("2026-07-26", "2026-09-05")).toHaveLength(42);
  });

  it("moves across year boundaries", () => {
    expect(shiftMonthKey("2026-01", -1)).toBe("2025-12");
    expect(shiftMonthKey("2026-12", 1)).toBe("2027-01");
  });

  it("falls back when the requested month is not valid", () => {
    expect(normalizeMonthKey("not-a-month", "2026-08")).toBe("2026-08");
    expect(normalizeMonthKey("2026-09", "2026-08")).toBe("2026-09");
  });

  it("builds partial week, month, quarter, and custom insight ranges", () => {
    expect(
      getInsightRange({ period: "week", today: "2026-08-05" }),
    ).toMatchObject({
      end: "2026-08-05",
      isPartial: true,
      naturalEnd: "2026-08-09",
      period: "week",
      start: "2026-08-03",
    });
    expect(
      getInsightRange({ period: "month", today: "2026-08-05" }),
    ).toMatchObject({
      end: "2026-08-05",
      naturalEnd: "2026-08-31",
      start: "2026-08-01",
    });
    expect(
      getInsightRange({ period: "quarter", today: "2026-08-05" }),
    ).toMatchObject({
      end: "2026-08-05",
      naturalEnd: "2026-09-30",
      start: "2026-07-01",
    });
    expect(
      getInsightRange({
        customEnd: "2026-07-17",
        customStart: "2026-07-06",
        period: "custom",
        today: "2026-08-05",
      }),
    ).toMatchObject({
      end: "2026-07-17",
      isPartial: false,
      start: "2026-07-06",
    });
  });

  it("limits custom ranges and compares equal-length periods", () => {
    const range = getInsightRange({
      customEnd: "2026-08-05",
      customStart: "2026-08-01",
      period: "custom",
      today: "2026-08-05",
    });
    expect(range.previousStart).toBe("2026-07-27");
    expect(range.previousEnd).toBe("2026-07-31");

    expect(
      getInsightRange({
        customEnd: "2027-12-31",
        customStart: "2026-01-01",
        period: "custom",
        today: "2026-08-05",
      }),
    ).toMatchObject({ period: "month", start: "2026-08-01" });
  });
});

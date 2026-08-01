import { describe, expect, it } from "vitest";

import {
  datesInRange,
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
});

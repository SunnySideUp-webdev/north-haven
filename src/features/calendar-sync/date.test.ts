import { describe, expect, it } from "vitest";

import {
  expandAllDayDates,
  fullDayOooDates,
  normalizeGoogleEventWindow,
} from "@/features/calendar-sync/date";

describe("Google Calendar date normalization", () => {
  it("treats an all-day end date as exclusive", () => {
    expect(
      normalizeGoogleEventWindow(
        { date: "2026-08-03" },
        { date: "2026-08-05" },
        "America/Guatemala",
      ),
    ).toMatchObject({
      endLocalDate: "2026-08-04",
      isAllDay: true,
      startLocalDate: "2026-08-03",
    });
  });

  it("recognizes a timed OOO block from local midnight to midnight", () => {
    expect(
      fullDayOooDates(
        { dateTime: "2026-08-03T00:00:00-06:00" },
        { dateTime: "2026-08-04T00:00:00-06:00" },
        "America/Guatemala",
      ),
    ).toEqual(["2026-08-03"]);
  });

  it("does not treat partial-day OOO blocks as days off", () => {
    expect(
      fullDayOooDates(
        { dateTime: "2026-08-03T00:00:00-06:00" },
        { dateTime: "2026-08-03T08:00:00-06:00" },
        "America/Guatemala",
      ),
    ).toEqual([]);
  });

  it("assigns timed events to the workspace local date", () => {
    expect(
      normalizeGoogleEventWindow(
        { dateTime: "2026-08-04T01:00:00Z" },
        { dateTime: "2026-08-04T02:00:00Z" },
        "America/Guatemala",
      ),
    ).toMatchObject({
      endLocalDate: "2026-08-03",
      isAllDay: false,
      startLocalDate: "2026-08-03",
    });
  });

  it("expands every covered OOO date", () => {
    expect(expandAllDayDates("2026-08-03", "2026-08-06")).toEqual([
      "2026-08-03",
      "2026-08-04",
      "2026-08-05",
    ]);
  });
});

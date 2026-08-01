import { describe, expect, it } from "vitest";

import { GOOGLE_CALENDAR_SCOPES } from "@/features/calendar-sync/permissions";

describe("Google Calendar permissions", () => {
  it("requests only read-only Calendar scopes", () => {
    const calendarScopes = GOOGLE_CALENDAR_SCOPES.filter((scope) =>
      scope.startsWith("https://www.googleapis.com/auth/calendar"),
    );

    expect(calendarScopes).toEqual([
      "https://www.googleapis.com/auth/calendar.events.readonly",
      "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
    ]);
    expect(calendarScopes.every((scope) => scope.endsWith(".readonly"))).toBe(
      true,
    );
  });
});

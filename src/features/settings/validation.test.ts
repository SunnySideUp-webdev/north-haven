import { describe, expect, it } from "vitest";

import {
  manualNonWorkingDaySchema,
  profileSettingsSchema,
  settingsPasswordSchema,
  workScheduleSettingsSchema,
} from "@/features/settings/validation";

describe("settings validation", () => {
  it("normalizes a valid profile and schedule", () => {
    expect(profileSettingsSchema.parse({ displayName: "  Sunny  " })).toEqual({
      displayName: "Sunny",
    });
    expect(
      workScheduleSettingsSchema.parse({
        endsAtLocal: "17:00",
        startsAtLocal: "08:00",
        timeZone: "America/Guatemala",
        workingWeekdays: ["1", "2", "3", "4", "5"],
      }),
    ).toMatchObject({
      timeZone: "America/Guatemala",
      workingWeekdays: [1, 2, 3, 4, 5],
    });
  });

  it("rejects an invalid time order, time zone, or empty workweek", () => {
    expect(
      workScheduleSettingsSchema.safeParse({
        endsAtLocal: "08:00",
        startsAtLocal: "17:00",
        timeZone: "Not/AZone",
        workingWeekdays: [],
      }).success,
    ).toBe(false);
  });

  it("requires matching secure passwords and valid non-working days", () => {
    expect(
      settingsPasswordSchema.safeParse({
        confirmPassword: "different-password",
        password: "a-secure-password",
      }).success,
    ).toBe(false);
    expect(
      manualNonWorkingDaySchema.safeParse({
        kind: "holiday",
        workDate: "2026-12-25",
      }).success,
    ).toBe(true);
  });
});

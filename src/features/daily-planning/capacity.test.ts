import { describe, expect, it } from "vitest";

import {
  CAPACITY_REMINDER_THRESHOLD,
  shouldShowCapacityReminder,
} from "@/features/daily-planning/capacity";

describe("capacity guidance", () => {
  it("stays quiet below the approved threshold", () => {
    expect(shouldShowCapacityReminder(CAPACITY_REMINDER_THRESHOLD - 1)).toBe(
      false,
    );
  });

  it("appears at nine actionable items without changing the plan", () => {
    expect(shouldShowCapacityReminder(CAPACITY_REMINDER_THRESHOLD)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { createAccountSchema, setupSchema } from "./validation";

describe("authentication validation", () => {
  it("requires a twelve-character password and matching confirmation", () => {
    expect(
      createAccountSchema.safeParse({
        confirmPassword: "short",
        email: "sunny@example.com",
        password: "short",
      }).success,
    ).toBe(false);

    expect(
      createAccountSchema.safeParse({
        confirmPassword: "a-secure-password",
        email: "sunny@example.com",
        password: "a-secure-password",
      }).success,
    ).toBe(true);
  });

  it("requires workdays and a valid workday time range", () => {
    expect(
      setupSchema.safeParse({
        displayName: "Sunny",
        endsAtLocal: "08:00",
        startsAtLocal: "17:00",
        timeZone: "America/Guatemala",
        workingWeekdays: [],
      }).success,
    ).toBe(false);
  });
});

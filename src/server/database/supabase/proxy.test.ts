import { describe, expect, it } from "vitest";

import { isGuestOnlyPath, isProtectedPath } from "./proxy";

describe("authentication route boundaries", () => {
  it("protects every workspace destination and setup", () => {
    expect(isProtectedPath("/today")).toBe(true);
    expect(isProtectedPath("/work/tickets/123")).toBe(true);
    expect(isProtectedPath("/setup")).toBe(true);
  });

  it("keeps authentication entry pages guest-only", () => {
    expect(isGuestOnlyPath("/sign-in")).toBe(true);
    expect(isGuestOnlyPath("/forgot-password")).toBe(true);
    expect(isGuestOnlyPath("/today")).toBe(false);
  });
});

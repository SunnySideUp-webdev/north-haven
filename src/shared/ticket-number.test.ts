import { describe, expect, it } from "vitest";

import { formatTicketNumber } from "@/shared/ticket-number";

describe("formatTicketNumber", () => {
  it("adds the conventional ticket prefix", () => {
    expect(formatTicketNumber("79")).toBe("#79");
  });

  it("does not duplicate an existing prefix", () => {
    expect(formatTicketNumber("#79")).toBe("#79");
  });
});

import { describe, expect, it } from "vitest";

import {
  parseTicketSystemPaste,
  sourceStatusToOperationalStatus,
} from "@/features/work-items/bulk-ticket-import";

describe("ticket system paste parser", () => {
  it("extracts tickets from copied ticket-system text", () => {
    const tickets = parseTicketSystemPaste(
      `
39 tickets of 651
LE
Open Form Information | < All Season Pest Control > Current customer form changes #655
Leslie Morales
·
leslie.echegaray@prontobpo.com
·
Created 3 hours ago
Medium
Computer, Internet, And Form / Form Information
Open
PA
Open Form Information | < Pointe Pest Control – Chicago IL > Current customer #652
Paolo Rivas
·
paolo.rivas@prontobpo.cc
·
Created 7 days ago
High
Computer, Internet, And Form / Form Information
Open
      `,
      new Date("2026-08-26T15:00:00.000Z"),
    );

    expect(tickets).toHaveLength(2);
    expect(tickets[0]).toMatchObject({
      receivedAt: "2026-08-26",
      requesterEmail: "leslie.echegaray@prontobpo.com",
      requesterName: "Leslie Morales",
      sourceStatus: "Open",
      systemPriority: "medium",
      ticketNumber: "655",
      ticketTypeName: "Form Information",
      title: "< All Season Pest Control > Current customer form changes",
    });
    expect(tickets[1]).toMatchObject({
      receivedAt: "2026-08-19",
      systemPriority: "high",
      ticketNumber: "652",
    });
  });

  it("maps ticket-system statuses to North Haven operational statuses", () => {
    expect(sourceStatusToOperationalStatus("Open")).toBe("pending");
    expect(sourceStatusToOperationalStatus("In Progress")).toBe("in_progress");
    expect(sourceStatusToOperationalStatus("Waiting response")).toBe(
      "waiting_response",
    );
    expect(sourceStatusToOperationalStatus("Resolved")).toBe("resolved");
  });
});

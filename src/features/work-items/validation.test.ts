import { describe, expect, it } from "vitest";

import {
  reminderInputSchema,
  ticketInputSchema,
  ticketWorkflowInputSchema,
} from "@/features/work-items/validation";

describe("work item validation", () => {
  it("accepts a complete ticket and requires secure external links", () => {
    const ticket = {
      description: "A customer-requested change",
      externalUrl: "https://tickets.example.com/123",
      formBackupComplete: false,
      operationalStatus: "pending",
      receivedAt: "2026-07-31",
      systemPriority: "medium",
      ticketNumber: "123",
      ticketTypeId: "44ac6dfa-5676-4c66-8b05-404b6f6bc6bd",
      title: "Update the form",
    };

    expect(ticketInputSchema.safeParse(ticket).success).toBe(true);
    expect(
      ticketInputSchema.safeParse({
        ...ticket,
        externalUrl: "http://tickets.example.com/123",
      }).success,
    ).toBe(false);
  });

  it("accepts tracking tickets without a ticket number", () => {
    const ticket = {
      description: "Track follow-through that has no source ticket.",
      externalUrl: "",
      formBackupComplete: false,
      isTrackingTicket: true,
      operationalStatus: "pending",
      receivedAt: "2026-08-18",
      systemPriority: "medium",
      ticketNumber: "",
      ticketTypeId: "44ac6dfa-5676-4c66-8b05-404b6f6bc6bd",
      title: "Follow up with the vendor",
    };

    expect(ticketInputSchema.safeParse(ticket).success).toBe(true);
    expect(
      ticketInputSchema.safeParse({ ...ticket, isTrackingTicket: false })
        .success,
    ).toBe(false);
  });

  it("requires a timezone-aware instant for reminders", () => {
    expect(
      reminderInputSchema.safeParse({
        description: "",
        remindAt: "2026-08-03T14:00:00.000Z",
        title: "Review the changes",
      }).success,
    ).toBe(true);
    expect(
      reminderInputSchema.safeParse({
        description: "",
        remindAt: "2026-08-03T08:00",
        title: "Review the changes",
      }).success,
    ).toBe(false);
  });

  it("accepts only supported quick ticket workflow values", () => {
    const update = {
      operationalStatus: "waiting_response",
      systemPriority: "urgent",
      trackingState: "watching",
      workItemId: "91ddc257-9ed6-4178-bd22-ccb20453cb90",
    };

    expect(ticketWorkflowInputSchema.safeParse(update).success).toBe(true);
    expect(
      ticketWorkflowInputSchema.safeParse({
        ...update,
        trackingState: "deleted",
      }).success,
    ).toBe(false);
  });
});

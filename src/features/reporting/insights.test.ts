import { describe, expect, it } from "vitest";

import {
  buildInsightBuckets,
  getInsightSummary,
} from "@/features/reporting/insights";
import type {
  DailyMetric,
  InsightsView,
  InventoryMetric,
} from "@/features/reporting/types";

function daily(
  workDate: string,
  values: Partial<DailyMetric> = {},
): DailyMetric {
  return {
    completedItems: 0,
    dayNote: null,
    deferredItems: 0,
    hasImportantNote: false,
    isOutOfOffice: false,
    meetingsAttended: 0,
    planIntention: null,
    plannedItems: 0,
    plannedReminders: 0,
    plannedTasks: 0,
    plannedTickets: 0,
    planStatus: null,
    remindersCompleted: 0,
    returnedItems: 0,
    scheduledMeetings: 0,
    skippedItems: 0,
    tasksCompleted: 0,
    ticketsClosed: 0,
    ticketsResolved: 0,
    ticketsWorked: 0,
    workDate,
    ...values,
  };
}

function inventory(
  workDate: string,
  values: Partial<InventoryMetric> = {},
): InventoryMetric {
  return {
    activeTickets: 0,
    age0To7: 0,
    age15To30: 0,
    age31Plus: 0,
    age8To14: 0,
    averageActiveAge: 0,
    ticketsReceived: 0,
    waitingTickets: 0,
    watchingTickets: 0,
    workDate,
    ...values,
  };
}

describe("insight calculations", () => {
  it("combines daily reporting and inventory into chart buckets", () => {
    const buckets = buildInsightBuckets(
      [
        daily("2026-08-03", {
          completedItems: 2,
          plannedItems: 3,
          ticketsWorked: 2,
        }),
        daily("2026-08-04", { ticketsResolved: 1, ticketsWorked: 3 }),
      ],
      [
        inventory("2026-08-03", { activeTickets: 9, ticketsReceived: 2 }),
        inventory("2026-08-04", { activeTickets: 8, ticketsReceived: 1 }),
      ],
    );

    expect(buckets).toEqual([
      expect.objectContaining({
        active: 9,
        label: "Aug 3",
        received: 2,
        worked: 2,
      }),
      expect.objectContaining({
        active: 8,
        label: "Aug 4",
        received: 1,
        resolved: 1,
        worked: 3,
      }),
    ]);
  });

  it("excludes full-day OOO dates from the daily average", () => {
    const view: InsightsView = {
      daily: [
        daily("2026-08-03", { ticketsWorked: 4 }),
        daily("2026-08-04", { isOutOfOffice: true }),
        daily("2026-08-08", { ticketsWorked: 10 }),
      ],
      end: "2026-08-08",
      inventory: [inventory("2026-08-08")],
      isPartial: false,
      naturalEnd: "2026-08-08",
      period: "custom",
      previousTotals: {
        completedItems: 0,
        meetingsAttended: 0,
        plannedItems: 0,
        remindersCompleted: 0,
        tasksCompleted: 0,
        ticketsClosed: 0,
        ticketsResolved: 0,
        ticketsWorked: 0,
      },
      start: "2026-08-03",
      timeZone: "America/Guatemala",
      today: "2026-08-08",
      totals: {
        completedItems: 3,
        meetingsAttended: 0,
        plannedItems: 4,
        remindersCompleted: 0,
        tasksCompleted: 0,
        ticketsClosed: 0,
        ticketsResolved: 0,
        ticketsWorked: 1,
      },
      workStatus: { active: 0, total: 0, waiting: 0, watching: 0 },
      workingWeekdays: [1, 2, 3, 4, 5],
    };

    expect(getInsightSummary(view)).toMatchObject({
      averageDailyWorked: 4,
      planCompletion: 75,
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  applyPlannedTicketResolutionMetrics,
  buildReportNarrative,
  defaultReportConfig,
  getReportRange,
  reportConfigSchema,
  reportFilename,
} from "@/features/reporting/reports";
import { reportFixture } from "@/test/report-fixture";

describe("reports", () => {
  it("keeps customer-sensitive content disabled by default", () => {
    const config = defaultReportConfig("2026-08-01");
    expect(config).toMatchObject({
      includeDayNotes: false,
      includeFollowUpReasons: false,
      includeTicketDetails: false,
      includeNarrative: true,
      includeStatus: true,
      includeSummaryMetrics: true,
      includeTrend: true,
    });
    expect(reportConfigSchema.safeParse(config).success).toBe(true);
  });

  it("builds exact daily, configured-workweek, and partial monthly ranges", () => {
    expect(
      getReportRange({
        anchor: "2026-07-29",
        period: "daily",
        today: "2026-08-01",
        workingWeekdays: [1, 2, 3, 4, 5],
      }),
    ).toEqual({
      end: "2026-07-29",
      isPartial: false,
      naturalEnd: "2026-07-29",
      start: "2026-07-29",
    });
    expect(
      getReportRange({
        anchor: "2026-07-29",
        period: "weekly",
        today: "2026-08-01",
        workingWeekdays: [1, 2, 3, 4, 5],
      }),
    ).toEqual({
      end: "2026-07-31",
      isPartial: false,
      naturalEnd: "2026-07-31",
      start: "2026-07-27",
    });
    expect(
      getReportRange({
        anchor: "2026-08-01",
        period: "monthly",
        today: "2026-08-01",
        workingWeekdays: [1, 2, 3, 4, 5],
      }),
    ).toEqual({
      end: "2026-08-01",
      isPartial: true,
      naturalEnd: "2026-08-31",
      start: "2026-08-01",
    });
  });

  it("uses neutral filenames and produces a plain-language summary", () => {
    expect(reportFilename("weekly", "2026-07-27", "2026-07-31", "pdf")).toBe(
      "north-haven-weekly-2026-07-27-to-2026-07-31.pdf",
    );
    const report = reportFixture();
    expect(
      buildReportNarrative({
        daily: report.daily,
        inventory: report.inventory,
        period: "weekly",
        totals: report.totals,
        workStatus: report.workStatus,
      }),
    ).toEqual([
      "Tuesday had the highest worked count with 3 tickets.",
      "88% of eligible planned items were completed.",
      "3 tickets remain waiting for a response at period end.",
    ]);
  });

  it("counts resolved report tickets from planned work instead of status events", () => {
    const base = reportFixture();
    const report = reportFixture({
      daily: [
        {
          ...base.daily[0],
          ticketsResolved: 0,
          workDate: "2026-08-17",
        },
        {
          ...base.daily[1],
          ticketsResolved: 0,
          workDate: "2026-08-18",
        },
      ],
      totals: {
        ...base.totals,
        ticketsResolved: 0,
      },
    });

    const result = applyPlannedTicketResolutionMetrics({
      daily: report.daily,
      rows: [
        {
          isResolved: true,
          workDate: "2026-08-17",
          workItemId: "ticket-1",
        },
        {
          isResolved: true,
          workDate: "2026-08-17",
          workItemId: "ticket-2",
        },
        {
          isResolved: false,
          workDate: "2026-08-17",
          workItemId: "ticket-3",
        },
        {
          isResolved: true,
          workDate: "2026-08-18",
          workItemId: "ticket-1",
        },
      ],
      totals: report.totals,
    });

    expect(result.daily.map((day) => day.ticketsResolved)).toEqual([2, 1]);
    expect(result.totals.ticketsResolved).toBe(2);
  });
});

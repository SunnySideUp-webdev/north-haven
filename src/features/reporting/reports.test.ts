import { describe, expect, it } from "vitest";

import {
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
});

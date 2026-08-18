import { z } from "zod";

import {
  getMonthRange,
  isDateKey,
  shiftDateKey,
} from "@/features/reporting/date";
import type {
  DailyMetric,
  InventoryMetric,
  PeriodTotals,
  WorkStatusSnapshot,
} from "@/features/reporting/types";

export const reportPeriodSchema = z.enum(["daily", "weekly", "monthly"]);
export const reportFormatSchema = z.enum(["pdf", "csv"]);

export const reportConfigSchema = z.object({
  anchor: z.string().refine(isDateKey, "Choose a valid date."),
  format: reportFormatSchema,
  includeDayNotes: z.boolean(),
  includeFollowUpReasons: z.boolean(),
  includeNarrative: z.boolean(),
  includeStatus: z.boolean(),
  includeSummaryMetrics: z.boolean(),
  includeTaskDetails: z.boolean().default(false),
  includeTicketDetails: z.boolean(),
  includeTrend: z.boolean(),
  period: reportPeriodSchema,
});

export type ReportConfig = z.infer<typeof reportConfigSchema>;
export type ReportPeriod = z.infer<typeof reportPeriodSchema>;
export type ReportFormat = z.infer<typeof reportFormatSchema>;

export type ReportRange = {
  end: string;
  isPartial: boolean;
  naturalEnd: string;
  start: string;
};

export type ReportTicketDetail = {
  ticketNumber: string;
  title: string;
  workItemId: string;
  workDates: string[];
};

export type ReportTaskDetail = {
  title: string;
  workItemId: string;
  workDates: string[];
};

export type ReportDayNote = {
  body: string;
  isImportant: boolean;
  workDate: string;
};

export type ReportFollowUp = {
  reason: string;
  reviewOn: string;
  ticketNumber: string | null;
  title: string;
  waitingOn: string | null;
};

export type ReportView = {
  config: ReportConfig;
  daily: DailyMetric[];
  dayNotes: ReportDayNote[];
  end: string;
  followUpDecisions: number;
  followUpDecisionsByDate: { count: number; workDate: string }[];
  followUpDueCount: number;
  followUps: ReportFollowUp[];
  generatedAt: string;
  hasData: boolean;
  inventory: InventoryMetric[];
  isPartial: boolean;
  narrative: string[];
  naturalEnd: string;
  previousTotals: PeriodTotals;
  schedule: {
    endsAtLocal: string;
    startsAtLocal: string;
    workingWeekdays: number[];
  };
  start: string;
  taskDetails: ReportTaskDetail[];
  ticketDetails: ReportTicketDetail[];
  timeZone: string;
  today: string;
  totals: PeriodTotals;
  workStatus: WorkStatusSnapshot;
};

export function defaultReportConfig(today: string): ReportConfig {
  return {
    anchor: today,
    format: "pdf",
    includeDayNotes: false,
    includeFollowUpReasons: false,
    includeNarrative: true,
    includeStatus: true,
    includeSummaryMetrics: true,
    includeTaskDetails: false,
    includeTicketDetails: false,
    includeTrend: true,
    period: "weekly",
  };
}

function isoWeekday(value: string) {
  const weekday = new Date(`${value}T12:00:00Z`).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

export function getReportRange({
  anchor,
  period,
  today,
  workingWeekdays,
}: {
  anchor: string;
  period: ReportPeriod;
  today: string;
  workingWeekdays: number[];
}): ReportRange {
  if (!isDateKey(today)) throw new Error("Invalid current date.");
  const selected = isDateKey(anchor) && anchor <= today ? anchor : today;
  let start = selected;
  let naturalEnd = selected;

  if (period === "monthly") {
    const month = getMonthRange(selected.slice(0, 7));
    start = month.monthStart;
    naturalEnd = month.monthEnd;
  } else if (period === "weekly") {
    const monday = shiftDateKey(selected, -(isoWeekday(selected) - 1));
    const eligible = workingWeekdays.length
      ? [...workingWeekdays].sort((a, b) => a - b)
      : [1, 2, 3, 4, 5];
    start = shiftDateKey(monday, eligible[0] - 1);
    naturalEnd = shiftDateKey(monday, eligible.at(-1)! - 1);
  }

  const isPartial = start <= today && today < naturalEnd;
  return {
    end: isPartial ? today : naturalEnd,
    isPartial,
    naturalEnd,
    start,
  };
}

export function reportTitle(period: ReportPeriod) {
  return `${period[0].toUpperCase()}${period.slice(1)} work summary`;
}

export function reportFilename(
  period: ReportPeriod,
  start: string,
  end: string,
  format: ReportFormat,
) {
  const range =
    period === "daily"
      ? start
      : period === "monthly"
        ? start.slice(0, 7)
        : `${start}-to-${end}`;
  return `north-haven-${period}-${range}.${format}`;
}

export function planCompletion(totals: PeriodTotals) {
  return totals.plannedItems
    ? Math.round((totals.completedItems / totals.plannedItems) * 100)
    : null;
}

export function buildReportNarrative({
  daily,
  inventory,
  period,
  totals,
  workStatus,
}: {
  daily: DailyMetric[];
  inventory: InventoryMetric[];
  period: ReportPeriod;
  totals: PeriodTotals;
  workStatus: WorkStatusSnapshot;
}) {
  if (!daily.length) return ["There is not enough activity for this period."];
  const top = daily.reduce((current, row) =>
    row.ticketsWorked > current.ticketsWorked ? row : current,
  );
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(`${top.workDate}T12:00:00Z`));
  const completion = planCompletion(totals);
  const lines: string[] = [];

  if (period === "daily") {
    if (daily[0].isOutOfOffice) {
      lines.push("This date was marked Out of Office.");
    }
    if (totals.ticketsWorked) {
      lines.push(
        `${totals.ticketsWorked} ticket${totals.ticketsWorked === 1 ? " was" : "s were"} worked during the day.`,
      );
    }
  } else if (top.ticketsWorked) {
    lines.push(
      `${weekday} had the highest worked count with ${top.ticketsWorked} ticket${top.ticketsWorked === 1 ? "" : "s"}.`,
    );
  }

  if (completion !== null) {
    lines.push(`${completion}% of eligible planned items were completed.`);
  }
  if (workStatus.waiting) {
    lines.push(
      `${workStatus.waiting} ticket${workStatus.waiting === 1 ? " remains" : "s remain"} waiting for a response at period end.`,
    );
  } else if (inventory.at(-1)?.activeTickets) {
    lines.push("No active ticket was waiting for a response at period end.");
  }
  return lines.length
    ? lines
    : ["There is not enough activity to identify a work pattern yet."];
}

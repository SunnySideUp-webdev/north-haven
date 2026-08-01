import { shiftDateKey } from "@/features/reporting/date";
import type {
  DailyMetric,
  InsightsView,
  InventoryMetric,
} from "@/features/reporting/types";

export type InsightBucket = {
  active: number;
  completed: number;
  end: string;
  label: string;
  planned: number;
  received: number;
  resolved: number;
  start: string;
  worked: number;
};

function date(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date(value));
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
    year: "2-digit",
  }).format(date(value));
}

function span(start: string, end: string) {
  return (
    Math.round((date(end).valueOf() - date(start).valueOf()) / 86_400_000) + 1
  );
}

function bucketKey(value: string, granularity: "day" | "week" | "month") {
  if (granularity === "day") return value;
  if (granularity === "month") return `${value.slice(0, 7)}-01`;
  const valueDate = date(value);
  const offset = (valueDate.getUTCDay() + 6) % 7;
  return shiftDateKey(value, -offset);
}

function labelForBucket(
  start: string,
  end: string,
  granularity: "day" | "week" | "month",
) {
  if (granularity === "day") return shortDate(start);
  if (granularity === "month") return monthLabel(start);
  return start === end
    ? shortDate(start)
    : `${shortDate(start)}–${shortDate(end)}`;
}

export function buildInsightBuckets(
  daily: DailyMetric[],
  inventory: InventoryMetric[],
): InsightBucket[] {
  if (!daily.length) return [];
  const totalDays = span(daily[0].workDate, daily.at(-1)!.workDate);
  const granularity =
    totalDays <= 14 ? "day" : totalDays <= 70 ? "week" : "month";
  const inventoryByDate = new Map(inventory.map((row) => [row.workDate, row]));
  const groups = new Map<string, InsightBucket>();

  for (const row of daily) {
    const key = bucketKey(row.workDate, granularity);
    const current = groups.get(key) ?? {
      active: 0,
      completed: 0,
      end: row.workDate,
      label: "",
      planned: 0,
      received: 0,
      resolved: 0,
      start: row.workDate,
      worked: 0,
    };
    const inventoryRow = inventoryByDate.get(row.workDate);
    current.end = row.workDate;
    current.worked += row.ticketsWorked;
    current.resolved += row.ticketsResolved;
    current.planned += row.plannedItems;
    current.completed += row.completedItems;
    current.received += inventoryRow?.ticketsReceived ?? 0;
    current.active = inventoryRow?.activeTickets ?? current.active;
    groups.set(key, current);
  }

  return [...groups.values()].map((bucket) => ({
    ...bucket,
    label: labelForBucket(bucket.start, bucket.end, granularity),
  }));
}

export function getInsightSummary(view: InsightsView) {
  const inventoryEnd = view.inventory.at(-1) ?? null;
  const eligibleRows = view.daily.filter((row) => {
    const weekday = date(row.workDate).getUTCDay();
    return view.workingWeekdays.includes(weekday) && !row.isOutOfOffice;
  });
  const workedTicketDays = eligibleRows.reduce(
    (sum, row) => sum + row.ticketsWorked,
    0,
  );
  const planCompletion = view.totals.plannedItems
    ? Math.round((view.totals.completedItems / view.totals.plannedItems) * 100)
    : null;

  return {
    averageDailyWorked: eligibleRows.length
      ? workedTicketDays / eligibleRows.length
      : 0,
    inventoryEnd,
    planCompletion,
    totalReceived: view.inventory.reduce(
      (sum, row) => sum + row.ticketsReceived,
      0,
    ),
  };
}

export function periodLabel(start: string, end: string) {
  const startYear = date(start).getUTCFullYear();
  const endYear = date(end).getUTCFullYear();
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  });
  if (start === end) return formatter.format(date(start));
  if (startYear === endYear) {
    const compactStart = new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(date(start));
    return `${compactStart} – ${formatter.format(date(end))}`;
  }
  return `${formatter.format(date(start))} – ${formatter.format(date(end))}`;
}

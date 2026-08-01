const monthPattern = /^(\d{4})-(0[1-9]|1[0-2])$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type InsightPeriod = "week" | "month" | "quarter" | "custom";

export type InsightRange = {
  end: string;
  isPartial: boolean;
  naturalEnd: string;
  period: InsightPeriod;
  previousEnd: string;
  previousStart: string;
  start: string;
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateFromKey(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

function isDateKey(value: string | undefined): value is string {
  if (!value || !datePattern.test(value)) return false;
  const date = dateFromKey(value);
  return !Number.isNaN(date.valueOf()) && isoDate(date) === value;
}

export function shiftDateKey(value: string, days: number) {
  if (!isDateKey(value)) throw new Error("Invalid date.");
  const shifted = dateFromKey(value);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return isoDate(shifted);
}

function daySpan(start: string, end: string) {
  return Math.round(
    (dateFromKey(end).valueOf() - dateFromKey(start).valueOf()) / 86_400_000,
  );
}

export function monthKeyForInstant(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}`;
}

export function dateKeyForInstant(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

export function normalizeMonthKey(value: string | undefined, fallback: string) {
  return value && monthPattern.test(value) ? value : fallback;
}

export function getMonthRange(monthKey: string) {
  if (!monthPattern.test(monthKey)) throw new Error("Invalid month.");
  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(Date.UTC(year, month - 1, 1, 12));
  const monthEnd = new Date(Date.UTC(year, month, 0, 12));
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());
  const gridEnd = new Date(gridStart);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + 41);

  return {
    gridEnd: isoDate(gridEnd),
    gridStart: isoDate(gridStart),
    monthEnd: isoDate(monthEnd),
    monthStart: isoDate(monthStart),
  };
}

export function shiftMonthKey(monthKey: string, offset: number) {
  if (!monthPattern.test(monthKey)) throw new Error("Invalid month.");
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1, 12));
  return shifted.toISOString().slice(0, 7);
}

export function datesInRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);

  while (cursor <= end && dates.length < 371) {
    dates.push(isoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function getInsightRange({
  anchor,
  customEnd,
  customStart,
  period: requestedPeriod,
  today,
}: {
  anchor?: string;
  customEnd?: string;
  customStart?: string;
  period?: string;
  today: string;
}): InsightRange {
  if (!isDateKey(today)) throw new Error("Invalid current date.");
  let period: InsightPeriod = ["week", "month", "quarter", "custom"].includes(
    requestedPeriod ?? "",
  )
    ? (requestedPeriod as InsightPeriod)
    : "month";
  const selected = isDateKey(anchor) && anchor <= today ? anchor : today;
  const validCustomRange =
    isDateKey(customStart) &&
    isDateKey(customEnd) &&
    customStart <= today &&
    customStart <= customEnd &&
    daySpan(customStart, customEnd) <= 370;
  if (period === "custom" && !validCustomRange) period = "month";
  let start: string;
  let naturalEnd: string;

  if (period === "custom" && validCustomRange) {
    start = customStart;
    naturalEnd = customEnd;
  } else if (period === "week") {
    const date = dateFromKey(selected);
    const offsetFromMonday = (date.getUTCDay() + 6) % 7;
    start = shiftDateKey(selected, -offsetFromMonday);
    naturalEnd = shiftDateKey(start, 6);
  } else if (period === "quarter") {
    const date = dateFromKey(selected);
    const quarterMonth = Math.floor(date.getUTCMonth() / 3) * 3;
    start = isoDate(
      new Date(Date.UTC(date.getUTCFullYear(), quarterMonth, 1, 12)),
    );
    naturalEnd = isoDate(
      new Date(Date.UTC(date.getUTCFullYear(), quarterMonth + 3, 0, 12)),
    );
  } else {
    const monthKey = selected.slice(0, 7);
    const monthRange = getMonthRange(monthKey);
    start = monthRange.monthStart;
    naturalEnd = monthRange.monthEnd;
  }

  const isPartial = start <= today && today < naturalEnd;
  const end = isPartial ? today : naturalEnd;
  const span = daySpan(start, end);
  const previousEnd = shiftDateKey(start, -1);

  return {
    end,
    isPartial,
    naturalEnd,
    period,
    previousEnd,
    previousStart: shiftDateKey(previousEnd, -span),
    start,
  };
}

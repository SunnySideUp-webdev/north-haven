const monthPattern = /^(\d{4})-(0[1-9]|1[0-2])$/;

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
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

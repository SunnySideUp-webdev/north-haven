export type GoogleEventDate = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

function localDateForInstant(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date(value));
  const valueByPart = new Map(parts.map((part) => [part.type, part.value]));
  return `${valueByPart.get("year")}-${valueByPart.get("month")}-${valueByPart.get("day")}`;
}

function previousDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function normalizeGoogleEventWindow(
  start: GoogleEventDate,
  end: GoogleEventDate,
  workspaceTimeZone: string,
) {
  if (start.date && end.date) {
    return {
      endLocalDate: previousDate(end.date),
      endsAt: `${end.date}T00:00:00.000Z`,
      isAllDay: true,
      startLocalDate: start.date,
      startsAt: `${start.date}T00:00:00.000Z`,
    };
  }

  if (!start.dateTime || !end.dateTime) return null;

  const endsAt = new Date(end.dateTime);
  const lastCoveredInstant = new Date(endsAt.getTime() - 1);
  return {
    endLocalDate: localDateForInstant(
      lastCoveredInstant.toISOString(),
      workspaceTimeZone,
    ),
    endsAt: endsAt.toISOString(),
    isAllDay: false,
    startLocalDate: localDateForInstant(start.dateTime, workspaceTimeZone),
    startsAt: new Date(start.dateTime).toISOString(),
  };
}

export function expandAllDayDates(startDate: string, exclusiveEndDate: string) {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${exclusiveEndDate}T12:00:00Z`);

  while (cursor < end && dates.length < 370) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

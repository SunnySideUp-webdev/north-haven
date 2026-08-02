"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  saveCalendarDayColorAction,
  saveMonthNoteAction,
} from "@/features/reporting/actions";
import { datesInRange, shiftMonthKey } from "@/features/reporting/date";
import type {
  CalendarDayColor,
  DailyMetric,
  MonthlyCalendarView,
} from "@/features/reporting/types";
import { calendarDayColors } from "@/features/reporting/types";

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type VisibleMetrics = {
  meetings: boolean;
  notes: boolean;
  planned: boolean;
  resolved: boolean;
  worked: boolean;
};

const dayColorLabels: Record<CalendarDayColor, string> = {
  default: "Default",
  lavender: "Lavender",
  blush: "Blush",
  rose: "Rose",
  cream: "Cream",
  sage: "Sage",
};

const dayColorSwatches: Record<CalendarDayColor, string> = {
  default: "bg-paper border-border",
  lavender: "bg-lavender-100 border-lavender-300",
  blush: "bg-blush-100 border-blush-300",
  rose: "bg-urgent-surface border-blush-300",
  cream: "bg-waiting-surface border-waiting-ink/25",
  sage: "bg-success-surface border-success-ink/25",
};

const dayColorSurfaces: Record<CalendarDayColor, string> = {
  default: "bg-paper hover:bg-lavender-50",
  lavender: "bg-lavender-100 hover:bg-lavender-200",
  blush: "bg-blush-100 hover:bg-blush-200",
  rose: "bg-urgent-surface hover:bg-blush-200",
  cream: "bg-waiting-surface hover:brightness-[0.98]",
  sage: "bg-success-surface hover:brightness-[0.98]",
};

function dateFromKey(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

function fullDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(dateFromKey(value));
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(dateFromKey(value));
}

function plural(value: number, singular: string, pluralValue = `${singular}s`) {
  return `${value} ${value === 1 ? singular : pluralValue}`;
}

function hasRecordedActivity(row: DailyMetric) {
  return Boolean(
    row.ticketsWorked ||
    row.ticketsResolved ||
    row.ticketsClosed ||
    row.tasksCompleted ||
    row.remindersCompleted ||
    row.meetingsAttended ||
    row.plannedItems ||
    row.dayNote ||
    row.isOutOfOffice,
  );
}

function hasCompletedActivity(row: DailyMetric) {
  return Boolean(
    row.ticketsWorked ||
    row.ticketsResolved ||
    row.ticketsClosed ||
    row.tasksCompleted ||
    row.remindersCompleted ||
    row.meetingsAttended,
  );
}

export function MonthlyCalendar({
  calendar,
  googleConnected,
}: {
  calendar: MonthlyCalendarView;
  googleConnected: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [visible, setVisible] = useState<VisibleMetrics>({
    meetings: true,
    notes: true,
    planned: true,
    resolved: true,
    worked: true,
  });
  const [appearanceState, setAppearanceState] = useState({
    colors: calendar.dayColors,
    monthKey: calendar.monthKey,
  });
  const [openAppearanceDate, setOpenAppearanceDate] = useState<string | null>(
    null,
  );
  const [appearanceMessage, setAppearanceMessage] = useState<string>();
  const [monthNoteDraft, setMonthNoteDraft] = useState({
    body: calendar.monthNote,
    monthKey: calendar.monthKey,
  });
  const [noteStatus, setNoteStatus] = useState<{
    message?: string;
    monthKey: string;
  }>({ monthKey: calendar.monthKey });
  const rowByDate = useMemo(
    () => new Map(calendar.rows.map((row) => [row.workDate, row])),
    [calendar.rows],
  );
  const dates = useMemo(
    () => datesInRange(calendar.gridStart, calendar.gridEnd),
    [calendar.gridEnd, calendar.gridStart],
  );
  const defaultDate = useMemo(() => {
    if (calendar.today.startsWith(calendar.monthKey)) return calendar.today;
    return (
      calendar.rows.find(
        (row) =>
          row.workDate.startsWith(calendar.monthKey) &&
          hasRecordedActivity(row),
      )?.workDate ?? calendar.monthStart
    );
  }, [calendar]);
  const [selection, setSelection] = useState<{
    date: string | null;
    monthKey: string;
  }>({ date: defaultDate, monthKey: calendar.monthKey });
  const monthNote =
    monthNoteDraft.monthKey === calendar.monthKey
      ? monthNoteDraft.body
      : calendar.monthNote;
  const noteMessage =
    noteStatus.monthKey === calendar.monthKey ? noteStatus.message : undefined;
  const selectedDate =
    selection.monthKey === calendar.monthKey ? selection.date : defaultDate;
  const dayColors =
    appearanceState.monthKey === calendar.monthKey
      ? appearanceState.colors
      : calendar.dayColors;

  const selected = selectedDate ? rowByDate.get(selectedDate) : undefined;
  const [year, month] = calendar.monthKey.split("-").map(Number);
  const currentYear = Number(calendar.currentMonth.slice(0, 4));
  const firstYear = Math.min(year - 5, currentYear - 5);
  const years = Array.from({ length: 11 }, (_, index) => firstYear + index);

  function changeMonth(nextMonth: string) {
    startTransition(() => router.push(`/calendar?month=${nextMonth}`));
  }

  function saveNote() {
    setNoteStatus({ monthKey: calendar.monthKey });
    startTransition(async () => {
      const result = await saveMonthNoteAction({
        body: monthNote,
        monthKey: calendar.monthKey,
      });
      setNoteStatus({
        message: result.message,
        monthKey: calendar.monthKey,
      });
      if (result.ok) router.refresh();
    });
  }

  function saveDayColor(workDate: string, color: CalendarDayColor) {
    setAppearanceMessage(undefined);
    startTransition(async () => {
      const result = await saveCalendarDayColorAction({ color, workDate });
      if (!result.ok) {
        setAppearanceMessage(result.message);
        return;
      }
      setAppearanceState((current) => {
        const colors =
          current.monthKey === calendar.monthKey
            ? { ...current.colors }
            : { ...calendar.dayColors };
        if (color === "default") delete colors[workDate];
        else colors[workDate] = color;
        return { colors, monthKey: calendar.monthKey };
      });
      setOpenAppearanceDate(null);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto grid max-w-[1440px] grid-cols-[220px_minmax(0,1fr)] gap-6 p-8">
      <aside className="bg-lavender-50 self-start rounded-xl p-6">
        <p className="text-quiet text-[11px] font-bold tracking-[0.12em] uppercase">
          Today
        </p>
        <p className="text-ink mt-3 text-lg font-bold">
          {shortDate(calendar.today)}
        </p>

        <div className="border-border mt-6 space-y-5 border-t pt-6">
          <label className="text-quiet block text-[11px] font-bold tracking-[0.12em] uppercase">
            Month
            <select
              value={month - 1}
              disabled={pending}
              onChange={(event) =>
                changeMonth(
                  `${year}-${String(Number(event.target.value) + 1).padStart(2, "0")}`,
                )
              }
              className="border-border bg-paper text-ink mt-2 block w-full rounded-lg border px-3 py-3 text-sm font-medium tracking-normal normal-case"
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-quiet block text-[11px] font-bold tracking-[0.12em] uppercase">
            Year
            <select
              value={year}
              disabled={pending}
              onChange={(event) =>
                changeMonth(
                  `${event.target.value}-${String(month).padStart(2, "0")}`,
                )
              }
              className="border-border bg-paper text-ink mt-2 block w-full rounded-lg border px-3 py-3 text-sm font-medium tracking-normal normal-case"
            >
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => changeMonth(shiftMonthKey(calendar.monthKey, -1))}
              className="border-border bg-paper text-muted flex-1 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => changeMonth(shiftMonthKey(calendar.monthKey, 1))}
              className="border-border bg-paper text-muted flex-1 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <fieldset className="border-border mt-6 border-t pt-6">
          <legend className="text-quiet text-[11px] font-bold tracking-[0.12em] uppercase">
            Show
          </legend>
          <div className="mt-4 space-y-3">
            {(Object.keys(visible) as (keyof VisibleMetrics)[]).map((key) => (
              <label
                key={key}
                className="text-ink flex items-center gap-2.5 text-sm capitalize"
              >
                <input
                  type="checkbox"
                  checked={visible[key]}
                  onChange={(event) =>
                    setVisible((current) => ({
                      ...current,
                      [key]: event.target.checked,
                    }))
                  }
                  className="accent-lavender-700 h-4 w-4"
                />
                {key}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="border-border mt-6 border-t pt-6">
          <label className="text-quiet text-[11px] font-bold tracking-[0.12em] uppercase">
            Month note
            <textarea
              value={monthNote}
              onChange={(event) =>
                setMonthNoteDraft({
                  body: event.target.value,
                  monthKey: calendar.monthKey,
                })
              }
              rows={5}
              maxLength={10_000}
              placeholder="A quiet note for this month…"
              className="border-border bg-paper text-ink placeholder:text-quiet mt-3 block w-full resize-none rounded-lg border p-3 text-sm leading-5 font-normal tracking-normal normal-case"
            />
          </label>
          <button
            type="button"
            disabled={pending || monthNote === calendar.monthNote}
            onClick={saveNote}
            className="bg-lavender-700 mt-3 w-full rounded-lg px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"
          >
            {pending ? "Saving…" : "Save note"}
          </button>
          {noteMessage ? (
            <p role="status" className="text-muted mt-2 text-xs">
              {noteMessage}
            </p>
          ) : null}
        </div>

        <div className="border-border mt-6 border-t pt-5">
          <p className="text-muted text-xs leading-5">
            {googleConnected
              ? "Google Calendar is connected in read-only mode."
              : "Work history remains available without Google Calendar."}
          </p>
          <Link
            href="/settings#calendar-connection"
            className="text-lavender-700 mt-2 inline-block text-xs font-bold"
          >
            Manage connection
          </Link>
        </div>
      </aside>

      <section
        aria-label={`${monthNames[month - 1]} ${year} work history`}
        className="relative min-w-0"
      >
        {appearanceMessage ? (
          <p
            role="alert"
            className="bg-urgent-surface text-urgent-ink mb-3 rounded-lg px-4 py-3 text-sm"
          >
            {appearanceMessage}
          </p>
        ) : null}
        <div className="border-border bg-paper grid grid-cols-7 rounded-xl border">
          {weekdays.map((weekday) => (
            <div
              key={weekday}
              className="bg-blush-100 text-ink border-border border-r px-2 py-4 text-center text-[10px] font-bold tracking-[0.08em] uppercase last:border-r-0"
            >
              {weekday}
            </div>
          ))}
          {dates.map((date, index) => {
            const row = rowByDate.get(date);
            const inMonth = date.startsWith(calendar.monthKey);
            const isSelected = selectedDate === date;
            const day = Number(date.slice(-2));
            const savedColor = dayColors[date];
            const selectedColor: CalendarDayColor = savedColor ?? "default";
            const surface = !inMonth
              ? "bg-canvas text-quiet"
              : savedColor
                ? dayColorSurfaces[savedColor]
                : row?.isOutOfOffice
                  ? "bg-[#DDD5E6] text-[#5f526d] hover:bg-[#DDD5E6]"
                  : dayColorSurfaces.default;
            const appearanceOpen = openAppearanceDate === date;
            const popupHorizontal =
              index % 7 <= 1
                ? "left-2"
                : index % 7 >= 5
                  ? "right-2"
                  : "left-1/2 -translate-x-1/2";
            return (
              <div
                key={date}
                className={`group border-border relative border-t border-r ${index % 7 === 6 ? "border-r-0" : ""} ${surface} ${isSelected ? "ring-lavender-500 z-10 ring-2 ring-inset" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenAppearanceDate(null);
                    setSelection({ date, monthKey: calendar.monthKey });
                  }}
                  aria-label={`Open summary for ${fullDate(date)}`}
                  aria-pressed={isSelected}
                  className="relative z-0 min-h-[130px] w-full p-3 text-left align-top"
                >
                  <span
                    className={`text-xs ${date === calendar.today ? "bg-lavender-700 inline-flex h-6 w-6 items-center justify-center rounded-full font-bold text-white" : "font-medium"}`}
                  >
                    {day}
                  </span>
                  {inMonth && row ? (
                    <div className="mt-3 space-y-1.5 text-[11px] leading-4">
                      {row.isOutOfOffice ? (
                        <span className="inline-block rounded-full bg-[#DDD5E6] px-2 py-1 text-[9px] font-bold tracking-[0.08em] text-[#5f526d] uppercase ring-1 ring-[#c9bdd5]">
                          OOO
                        </span>
                      ) : null}
                      {visible.planned && row.plannedItems ? (
                        <p className="text-lavender-700 font-bold">
                          {plural(row.plannedItems, "planned", "planned")}
                        </p>
                      ) : null}
                      {visible.worked && row.ticketsWorked ? (
                        <p>{plural(row.ticketsWorked, "worked", "worked")}</p>
                      ) : null}
                      {visible.resolved && row.ticketsResolved ? (
                        <p>
                          {plural(row.ticketsResolved, "resolved", "resolved")}
                        </p>
                      ) : null}
                      {visible.meetings && row.meetingsAttended ? (
                        <p>
                          {plural(row.meetingsAttended, "meeting")} attended
                        </p>
                      ) : null}
                      {visible.notes && row.hasImportantNote ? (
                        <p className="text-blush-600 font-bold">
                          • Important note
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {index % 7 === 0 || index % 7 === 6 ? (
                    <span className="sr-only">Weekend</span>
                  ) : null}
                </button>

                {inMonth ? (
                  <button
                    type="button"
                    aria-label={`Customize ${fullDate(date)}`}
                    aria-expanded={appearanceOpen}
                    onClick={() =>
                      setOpenAppearanceDate(appearanceOpen ? null : date)
                    }
                    className={`bg-paper/90 text-muted hover:text-ink absolute top-2 right-2 z-20 rounded-md px-2 py-1 text-xs font-bold tracking-[0.08em] shadow-sm transition-opacity ${appearanceOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"}`}
                  >
                    •••
                  </button>
                ) : null}

                {appearanceOpen ? (
                  <div
                    role="dialog"
                    aria-label={`Day color for ${fullDate(date)}`}
                    className={`border-border bg-paper shadow-surface absolute z-30 w-[210px] rounded-xl border p-4 ${popupHorizontal} ${index >= 35 ? "bottom-10" : "top-10"}`}
                  >
                    <p className="text-quiet text-[10px] font-bold tracking-[0.12em] uppercase">
                      Day color
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {calendarDayColors.map((color) => (
                        <button
                          type="button"
                          key={color}
                          disabled={pending}
                          aria-label={`Use ${dayColorLabels[color]} for ${fullDate(date)}`}
                          title={dayColorLabels[color]}
                          onClick={() => saveDayColor(date, color)}
                          className={`flex flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-[9px] font-bold ${selectedColor === color ? "bg-lavender-50 text-lavender-700" : "text-muted hover:bg-lavender-50"}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`h-6 w-6 rounded-full border ${dayColorSwatches[color]}`}
                          />
                          {dayColorLabels[color]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {selectedDate && selected ? (
          <aside className="border-border bg-paper shadow-surface absolute top-[72px] right-6 z-20 w-[340px] rounded-xl border p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-quiet text-[10px] font-bold tracking-[0.12em] uppercase">
                  Day summary
                </p>
                <h2 className="text-ink mt-2 text-lg font-bold">
                  {fullDate(selectedDate)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSelection({ date: null, monthKey: calendar.monthKey })
                }
                aria-label="Close day summary"
                className="text-quiet hover:text-ink rounded p-1 text-lg"
              >
                ×
              </button>
            </div>

            {hasCompletedActivity(selected) ? (
              <div className="mt-6 space-y-3 text-sm">
                {selected.isOutOfOffice ? (
                  <p className="text-lavender-700 font-bold">Out of Office</p>
                ) : null}
                {selected.ticketsWorked ? (
                  <p>{plural(selected.ticketsWorked, "ticket")} worked</p>
                ) : null}
                {selected.ticketsResolved ? (
                  <p>{plural(selected.ticketsResolved, "ticket")} resolved</p>
                ) : null}
                {selected.ticketsClosed ? (
                  <p>{plural(selected.ticketsClosed, "ticket")} closed</p>
                ) : null}
                {selected.tasksCompleted ? (
                  <p>{plural(selected.tasksCompleted, "task")} completed</p>
                ) : null}
                {selected.remindersCompleted ? (
                  <p>
                    {plural(selected.remindersCompleted, "reminder")} completed
                  </p>
                ) : null}
                {selected.meetingsAttended ? (
                  <p>{plural(selected.meetingsAttended, "meeting")} attended</p>
                ) : null}
              </div>
            ) : selected.plannedItems ? (
              <p className="text-muted mt-6 text-sm leading-6">
                This day is planned, but no work has been completed yet.
              </p>
            ) : (
              <p className="text-muted mt-6 text-sm leading-6">
                No completed work or confirmed outcomes were recorded for this
                day.
              </p>
            )}

            <div className="border-border mt-6 border-t pt-5">
              <p className="text-quiet text-[10px] font-bold tracking-[0.12em] uppercase">
                Plan vs actual
              </p>
              <p className="text-ink mt-3 text-sm">
                {selected.plannedItems} planned · {selected.completedItems}{" "}
                completed
              </p>
              {selected.deferredItems || selected.returnedItems ? (
                <p className="text-muted mt-2 text-xs">
                  {selected.deferredItems} deferred · {selected.returnedItems}
                  returned
                </p>
              ) : null}
              {selected.planIntention ? (
                <p className="text-muted mt-3 text-xs leading-5">
                  {selected.planIntention}
                </p>
              ) : null}
            </div>

            <div className="border-border mt-6 border-t pt-5">
              <p className="text-quiet text-[10px] font-bold tracking-[0.12em] uppercase">
                Day note
              </p>
              <p className="text-muted mt-3 text-sm leading-6 whitespace-pre-wrap">
                {selected.dayNote ?? "No day note recorded."}
              </p>
            </div>
          </aside>
        ) : null}
      </section>
    </div>
  );
}

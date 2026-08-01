"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { saveMonthNoteAction } from "@/features/reporting/actions";
import { datesInRange, shiftMonthKey } from "@/features/reporting/date";
import type {
  DailyMetric,
  MonthlyCalendarView,
} from "@/features/reporting/types";

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
  resolved: boolean;
  worked: boolean;
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
    resolved: true,
    worked: true,
  });
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
        <div className="border-border bg-paper grid grid-cols-7 overflow-hidden rounded-xl border">
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
            return (
              <button
                type="button"
                key={date}
                onClick={() =>
                  setSelection({ date, monthKey: calendar.monthKey })
                }
                aria-label={`Open summary for ${fullDate(date)}`}
                aria-pressed={isSelected}
                className={`border-border relative min-h-[130px] border-t border-r p-3 text-left align-top first:border-t-0 [&:nth-child(-n+14)]:border-t-0 [&:nth-child(7n)]:border-r-0 ${!inMonth ? "bg-canvas text-quiet" : "bg-paper text-ink hover:bg-lavender-50"} ${row?.isOutOfOffice && inMonth ? "bg-lavender-100" : ""} ${isSelected ? "ring-lavender-500 z-10 ring-2 ring-inset" : ""}`}
              >
                <span
                  className={`text-xs ${date === calendar.today ? "bg-lavender-700 inline-flex h-6 w-6 items-center justify-center rounded-full font-bold text-white" : "font-medium"}`}
                >
                  {day}
                </span>
                {inMonth && row ? (
                  <div className="mt-3 space-y-1.5 text-[11px] leading-4">
                    {row.isOutOfOffice ? (
                      <span className="bg-lavender-300 text-lavender-700 inline-block rounded-full px-2 py-1 text-[9px] font-bold tracking-[0.08em] uppercase">
                        OOO
                      </span>
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
                      <p>{plural(row.meetingsAttended, "meeting")} attended</p>
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

            {hasRecordedActivity(selected) ? (
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

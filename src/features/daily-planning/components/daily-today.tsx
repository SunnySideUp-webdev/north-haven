"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { CalendarDayView } from "@/features/calendar-sync/types";
import {
  saveDayNoteAction,
  setPlanItemDoneAction,
} from "@/features/daily-planning/actions";
import type { WorkInventoryRow } from "@/features/work-items/types";
import { formatTicketNumber } from "@/shared/ticket-number";
import { PageHeader } from "@/shared/ui/page-header";

type TodayItem = WorkInventoryRow & {
  planItem: { id: string; position: number; execution_status: string } | null;
};

function meetingTime(startsAt: string, endsAt: string, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  return (
    formatter.format(new Date(startsAt)) +
    " – " +
    formatter.format(new Date(endsAt))
  );
}

export function DailyToday({
  data,
  workDate,
}: {
  data: {
    calendar: CalendarDayView;
    dayNote: { body: string; is_important: boolean } | null;
    dueFollowUps: number;
    items: TodayItem[];
    plan: { id: string; status: string; intention: string | null } | null;
    timeZone: string;
  };
  workDate: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState(data.dayNote?.body ?? "");
  const [important, setImportant] = useState(
    data.dayNote?.is_important ?? false,
  );
  const [noteMessage, setNoteMessage] = useState<string>();
  const items = data.items
    .filter((item) => item.planItem)
    .sort((a, b) => a.planItem!.position - b.planItem!.position);
  const tickets = items.filter((item) => item.kind === "ticket");
  const others = items.filter((item) => item.kind !== "ticket");
  const meetings = data.calendar.meetings;
  const completed = items.filter(
    (item) => item.planItem?.execution_status === "done",
  ).length;

  function toggle(item: TodayItem) {
    startTransition(async () => {
      await setPlanItemDoneAction({
        done: item.planItem?.execution_status !== "done",
        planItemId: item.planItem!.id,
      });
      router.refresh();
    });
  }

  function saveNote() {
    startTransition(async () => {
      const result = await saveDayNoteAction({
        body: note,
        important,
        workDate,
      });
      setNoteMessage(result.message ?? (result.ok ? "Day note saved." : ""));
      if (result.ok) router.refresh();
    });
  }

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(workDate + "T12:00:00Z"));
  const planLabel = data.plan
    ? data.plan.status[0].toUpperCase() + data.plan.status.slice(1) + " plan"
    : "No plan yet";

  return (
    <>
      <PageHeader
        title="Today"
        align="center"
        description={dateLabel + " · " + planLabel}
        intention={data.plan?.intention ?? undefined}
      />
      {!items.length && !meetings.length ? (
        <div className="mx-auto max-w-[980px] p-8">
          <section className="border-border/70 bg-paper shadow-surface flex min-h-[520px] flex-col items-center justify-center rounded-xl border px-10 text-center">
            {data.calendar.isOutOfOffice ? (
              <span className="bg-lavender-100 text-lavender-700 mb-5 rounded-full px-3 py-1.5 text-xs font-bold">
                OOO
              </span>
            ) : null}
            <h2 className="text-ink text-2xl font-bold">
              {data.calendar.isOutOfOffice
                ? "You are out of office today."
                : "Nothing is planned for today."}
            </h2>
            <p className="text-muted mt-3 max-w-lg text-sm leading-6">
              {data.calendar.isOutOfOffice
                ? "Your OOO status stays visible, and planning remains fully available whenever you need it."
                : "Choose a few items from your work inventory to create a clear plan."}
            </p>
            <div className="mt-7 flex gap-3">
              <Link
                href={"/plan?date=" + workDate}
                className="bg-lavender-700 rounded-lg px-6 py-3 text-sm font-bold text-white"
              >
                Plan this day
              </Link>
              <Link
                href="/work"
                className="border-border text-muted rounded-lg border px-6 py-3 text-sm font-bold"
              >
                View work inventory
              </Link>
            </div>
          </section>
        </div>
      ) : (
        <div className="mx-auto grid max-w-[1440px] grid-cols-[270px_minmax(0,1fr)] gap-8 p-8">
          <aside className="bg-lavender-50 flex min-h-[650px] flex-col rounded-xl p-7">
            <h2 className="text-ink text-lg font-bold">Overview</h2>
            {data.calendar.isOutOfOffice ? (
              <div className="bg-lavender-100 text-lavender-700 mt-5 rounded-lg px-4 py-3 text-sm font-bold">
                OOO today
              </div>
            ) : null}
            <dl className="mt-7 space-y-4 text-sm">
              <div>{tickets.length} tickets</div>
              <div>{others.length} tasks and reminders</div>
              <div>{meetings.length} meetings</div>
              <div>{data.dueFollowUps} follow-ups due</div>
            </dl>
            <div className="border-border mt-8 border-t pt-7">
              <p className="text-quiet text-xs font-bold uppercase">
                Work progress
              </p>
              <p className="text-ink mt-3 text-xl font-bold">
                {items.length
                  ? completed + " of " + items.length
                  : "No action items"}
              </p>
              {items.length ? (
                <div className="bg-paper mt-3 h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-lavender-300 h-full"
                    style={{ width: (completed / items.length) * 100 + "%" }}
                  />
                </div>
              ) : null}
            </div>
            <section className="border-border mt-8 border-t pt-7">
              <h2 className="text-quiet text-xs font-bold uppercase">
                Day note
              </h2>
              <textarea
                aria-label="Day note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={5}
                className="border-border bg-paper text-ink placeholder:text-quiet mt-3 w-full resize-none rounded-lg border px-3 py-2 text-sm leading-5"
                placeholder="A private note for today..."
              />
              <label className="text-muted mt-3 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={important}
                  onChange={(event) => setImportant(event.target.checked)}
                  className="accent-lavender-700 h-4 w-4"
                />
                Important note
              </label>
              <button
                type="button"
                disabled={pending}
                onClick={saveNote}
                className="border-lavender-500 text-lavender-700 mt-4 w-full rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                Save note
              </button>
              {noteMessage ? (
                <p className="text-muted mt-3 text-xs" role="status">
                  {noteMessage}
                </p>
              ) : null}
            </section>
            <div className="mt-auto space-y-3">
              <Link
                href={"/end-of-day?date=" + workDate}
                className="bg-lavender-700 block rounded-lg px-5 py-3 text-center text-sm font-bold text-white"
              >
                Start End of Day
              </Link>
              <Link
                href={"/plan?date=" + workDate}
                className="border-lavender-500 text-lavender-700 block rounded-lg border px-5 py-3 text-center text-sm font-bold"
              >
                Edit today&apos;s plan
              </Link>
            </div>
          </aside>
          <main className="space-y-7">
            {data.calendar.connection &&
            data.calendar.connection.state !== "connected" ? (
              <div className="bg-waiting-surface text-waiting-ink rounded-xl px-5 py-4 text-sm">
                Calendar may be out of date. Your work plan is still fully
                available.
                <Link
                  href="/settings#calendar-connection"
                  className="ml-2 font-bold"
                >
                  Check connection
                </Link>
              </div>
            ) : null}
            {meetings.length ? (
              <section className="border-blush-200 bg-paper shadow-surface rounded-xl border p-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-ink text-xl font-bold">Meetings</h2>
                  <span className="text-blush-600 text-sm font-bold">
                    {meetings.length}
                  </span>
                </div>
                <div className="mt-5">
                  {meetings.map((meeting) => (
                    <article
                      key={meeting.id}
                      className="border-blush-200 flex items-center gap-5 border-t py-5 first:border-t-0"
                    >
                      <div className="bg-blush-100 h-10 w-1 rounded-full" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-ink text-sm font-bold">
                          {meeting.title}
                        </h3>
                        <p className="text-quiet mt-1 text-xs">
                          {meetingTime(
                            meeting.startsAt,
                            meeting.endsAt,
                            data.timeZone,
                          )}
                        </p>
                      </div>
                      {meeting.meetingUrl ? (
                        <a
                          href={meeting.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blush-600 text-xs font-bold"
                        >
                          Join meeting
                        </a>
                      ) : meeting.providerUrl ? (
                        <a
                          href={meeting.providerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blush-600 text-xs font-bold"
                        >
                          Open in Google
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
            <section className="border-border/70 bg-paper shadow-surface rounded-xl border p-8">
              <h2 className="text-ink text-xl font-bold">Work plan</h2>
              <div className="mt-5">
                {items.length ? (
                  [...tickets, ...others].map((item) => {
                    const done = item.planItem?.execution_status === "done";
                    const buttonClassName = [
                      "h-6 w-6 rounded border",
                      done
                        ? "bg-lavender-300 border-lavender-500 text-lavender-700"
                        : "border-lavender-300",
                    ].join(" ");
                    const titleClassName = [
                      "text-sm font-bold",
                      done ? "text-quiet line-through" : "text-ink",
                    ].join(" ");
                    return (
                      <article
                        key={item.id}
                        className="border-border hover:bg-lavender-50 group flex items-center gap-5 border-t py-5 first:border-t-0"
                      >
                        <button
                          disabled={pending}
                          onClick={() => toggle(item)}
                          aria-label={
                            (done ? "Reopen " : "Mark ") +
                            item.title +
                            (done ? "" : " done")
                          }
                          className={buttonClassName}
                        >
                          {done ? "✓" : ""}
                        </button>
                        <Link
                          href={`/work/${item.id}?from=today`}
                          prefetch={false}
                          className="focus-visible:ring-lavender-500 block min-w-0 flex-1 rounded-md py-1 outline-none focus-visible:ring-2"
                        >
                          <h3 className={titleClassName}>
                            {item.ticket_number
                              ? formatTicketNumber(item.ticket_number) + " · "
                              : ""}
                            {item.title}
                          </h3>
                          <p className="text-quiet mt-1 text-xs capitalize">
                            {item.kind} ·{" "}
                            {item.system_priority ?? item.tracking_state}
                          </p>
                        </Link>
                      </article>
                    );
                  })
                ) : (
                  <p className="text-muted py-8 text-center text-sm">
                    No actionable work is planned. Your meetings remain visible
                    above.
                  </p>
                )}
              </div>
            </section>
          </main>
        </div>
      )}
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import {
  getCalendarDay,
  getCalendarSettings,
} from "@/features/calendar-sync/queries";
import { requireAuthenticatedContext } from "@/server/auth/session";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const { profile } = await requireAuthenticatedContext();
  const timeZone = profile?.time_zone ?? "America/Guatemala";
  const workDate = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).format(new Date());
  const [settings, day] = await Promise.all([
    getCalendarSettings(),
    getCalendarDay(workDate),
  ]);
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Meetings and time away, calmly placed beside your work."
        action={
          <Link
            href="/settings#calendar-connection"
            className="border-border bg-paper text-muted rounded-lg border px-5 py-3 text-sm font-bold"
          >
            Manage connection
          </Link>
        }
      />
      <div className="mx-auto max-w-[1120px] space-y-7 p-8">
        {!settings.connection ? (
          <section className="border-border/70 bg-paper shadow-surface rounded-xl border p-10 text-center">
            <h2 className="text-ink text-2xl font-bold">
              Connect Google Calendar
            </h2>
            <p className="text-muted mx-auto mt-3 max-w-xl text-sm leading-6">
              See meetings and Out of Office time alongside your work plan.
              North Haven only reads the calendars you select.
            </p>
            <Link
              href="/settings#calendar-connection"
              className="bg-lavender-700 mt-7 inline-block rounded-lg px-6 py-3 text-sm font-bold text-white"
            >
              Open Calendar settings
            </Link>
          </section>
        ) : (
          <>
            <section className="bg-lavender-50 rounded-xl p-7">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-quiet text-xs font-bold tracking-[0.1em] uppercase">
                    Connected calendar
                  </p>
                  <h2 className="text-ink mt-2 text-lg font-bold">
                    {settings.connection.accountLabel}
                  </h2>
                  <p className="text-muted mt-1 text-sm">
                    {
                      settings.connection.calendars.filter(
                        (calendar) => calendar.isSelected,
                      ).length
                    }{" "}
                    selected · Read-only
                  </p>
                </div>
                <span className="bg-paper text-lavender-700 rounded-full px-3 py-1.5 text-xs font-bold capitalize">
                  {settings.connection.state}
                </span>
              </div>
            </section>

            {day.isOutOfOffice ? (
              <section className="border-lavender-200 bg-lavender-100 rounded-xl border p-7">
                <span className="text-lavender-700 text-xs font-bold tracking-[0.1em] uppercase">
                  OOO
                </span>
                <h2 className="text-ink mt-2 text-xl font-bold">
                  You are out of office today.
                </h2>
                <p className="text-muted mt-2 text-sm">
                  North Haven will skip today when proposing your next workday.
                </p>
              </section>
            ) : null}

            <section className="border-blush-200 bg-paper shadow-surface rounded-xl border p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-ink text-xl font-bold">
                    Today&apos;s meetings
                  </h2>
                  <p className="text-muted mt-1 text-sm">{workDate}</p>
                </div>
                <span className="text-blush-600 text-sm font-bold">
                  {day.meetings.length}
                </span>
              </div>
              <div className="mt-5">
                {day.meetings.length ? (
                  day.meetings.map((meeting) => (
                    <article
                      key={meeting.id}
                      className="border-blush-200 flex items-center gap-5 border-t py-5 first:border-t-0"
                    >
                      <span className="bg-blush-200 h-10 w-1 rounded-full" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-ink text-sm font-bold">
                          {meeting.title}
                        </h3>
                        <p className="text-quiet mt-1 text-xs">
                          {timeFormatter.format(new Date(meeting.startsAt))} –{" "}
                          {timeFormatter.format(new Date(meeting.endsAt))}
                        </p>
                      </div>
                      {meeting.providerUrl ? (
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
                  ))
                ) : (
                  <p className="text-muted py-10 text-center text-sm">
                    No meetings are scheduled for today.
                  </p>
                )}
              </div>
            </section>
          </>
        )}

        <section className="border-border/70 bg-paper rounded-xl border p-7">
          <p className="text-quiet text-xs font-bold tracking-[0.1em] uppercase">
            Next phase
          </p>
          <h2 className="text-ink mt-2 text-base font-bold">
            Monthly work history
          </h2>
          <p className="text-muted mt-2 text-sm leading-6">
            The monthly retrospective grid will combine actual work, resolved
            tickets, attended meetings, OOO dates, and important notes.
          </p>
        </section>
      </div>
    </>
  );
}

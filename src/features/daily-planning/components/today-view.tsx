import type {
  FoundationPlan,
  PlannedWorkItem,
} from "@/features/daily-planning/types";
import { PageHeader } from "@/shared/ui/page-header";

function formatWorkDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function WorkRow({
  item,
  featured = false,
}: {
  item: PlannedWorkItem;
  featured?: boolean;
}) {
  const displayTitle = item.ticketNumber
    ? `#${item.ticketNumber} · ${item.title}`
    : item.title;

  return (
    <article
      className={
        featured
          ? "border-lavender-200 bg-paper relative rounded-[10px] border px-8 py-6"
          : "border-border border-t px-8 py-5"
      }
    >
      {featured ? (
        <span className="bg-blush-200 absolute top-0 bottom-0 left-0 w-1.5 rounded-l-[10px]" />
      ) : null}
      <div className="flex items-center gap-6">
        <button
          type="button"
          className="border-lavender-300 bg-paper hover:bg-lavender-50 h-6 w-6 shrink-0 rounded border"
          aria-label={`Mark ${displayTitle} done`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3
              className={`${featured ? "text-lg font-bold" : "text-sm"} text-ink truncate`}
            >
              {displayTitle}
            </h3>
            {item.priority === "urgent" ? (
              <span className="bg-urgent-surface text-urgent-ink rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.1em] uppercase">
                Urgent
              </span>
            ) : null}
          </div>
          <p className="text-muted mt-2 text-xs">{item.metadata}</p>
        </div>
        <button
          type="button"
          className="text-lavender-500 hover:text-lavender-700 text-xs font-bold"
        >
          {featured ? "Start" : "Details"}
        </button>
      </div>
    </article>
  );
}

export function TodayView({ plan }: { plan: FoundationPlan }) {
  const tickets = plan.workItems.filter((item) => item.kind === "ticket");
  const tasksAndReminders = plan.workItems.filter(
    (item) => item.kind !== "ticket",
  );
  const totalActionable = plan.workItems.length;
  const progress = Math.min((plan.completedCount / totalActionable) * 100, 100);
  const nextMeeting = plan.meetings[0];

  return (
    <>
      <PageHeader
        title="Today"
        align="center"
        description={
          <>
            <time dateTime={plan.workDate.toISOString().slice(0, 10)}>
              {formatWorkDate(plan.workDate)}
            </time>{" "}
            · {plan.statusMessage}
          </>
        }
        intention={plan.intention}
      />

      <div className="mx-auto grid max-w-[1440px] grid-cols-[286px_minmax(0,1fr)] gap-8 p-8">
        <aside className="bg-lavender-50 flex min-h-[732px] flex-col rounded-xl p-8">
          <h2 className="text-lg font-bold">Overview</h2>

          <section className="mt-8">
            <h3 className="text-muted text-[11px] font-bold tracking-[0.12em] uppercase">
              Today&apos;s load
            </h3>
            <dl className="mt-5 space-y-3 text-sm">
              <div>{tickets.length} tickets</div>
              <div>{plan.meetings.length} meetings</div>
              <div>{tasksAndReminders.length} tasks and reminders</div>
            </dl>
          </section>

          <section className="border-border mt-8 border-t pt-8">
            <h3 className="text-muted text-[11px] font-bold tracking-[0.12em] uppercase">
              Progress
            </h3>
            <p className="mt-5 text-lg font-bold">
              {plan.completedCount} of {totalActionable}
            </p>
            <div
              className="bg-paper mt-4 h-2.5 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={totalActionable}
              aria-valuenow={plan.completedCount}
              aria-label="Daily plan progress"
            >
              <div
                className="bg-lavender-300 h-full rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <section className="border-border mt-8 border-t pt-8">
            <h3 className="text-muted text-[11px] font-bold tracking-[0.12em] uppercase">
              Next meeting
            </h3>
            <p className="mt-5 text-sm">
              {nextMeeting.time.split("–")[0]} · {nextMeeting.title}
            </p>
            <button
              type="button"
              className="text-lavender-500 hover:text-lavender-700 mt-3 text-left text-xs"
            >
              Open in Google Calendar
            </button>
          </section>

          <section className="border-border mt-8 border-t pt-8">
            <h3 className="text-muted text-[11px] font-bold tracking-[0.12em] uppercase">
              Follow-ups
            </h3>
            <p className="mt-5 text-sm">
              {plan.waitingCount} waiting or watching
            </p>
            <p className="text-blush-600 mt-3 text-xs">
              {plan.dueFollowUpCount} need review today
            </p>
          </section>

          <button
            type="button"
            className="border-lavender-500 bg-lavender-300 text-lavender-700 hover:bg-lavender-200 mt-auto min-h-12 rounded-lg border px-5 text-sm font-bold"
          >
            Start End of Day
          </button>
        </aside>

        <section className="bg-paper shadow-surface min-h-[732px] rounded-xl p-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Work plan</h2>
            <button
              type="button"
              className="text-lavender-500 hover:text-lavender-700 text-xs"
            >
              View unplanned work
            </button>
          </div>

          <div className="mt-6">
            {tickets.map((item, index) => (
              <WorkRow key={item.id} item={item} featured={index === 0} />
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold">Tasks and reminders</h2>
            <div className="mt-4">
              {tasksAndReminders.map((item) => (
                <WorkRow key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold">Meetings</h2>
            <div className="mt-4 space-y-3">
              {plan.meetings.map((meeting) => (
                <article
                  key={meeting.id}
                  className="bg-blush-100 flex items-center rounded-lg px-8 py-5 text-sm"
                >
                  <p className="font-medium">
                    {meeting.time} · {meeting.title}
                  </p>
                  <p className="text-muted ml-auto text-xs">{meeting.source}</p>
                  <button
                    type="button"
                    className="text-blush-600 hover:text-ink ml-12 text-xs"
                  >
                    Join meeting
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

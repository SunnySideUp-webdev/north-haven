import type { Metadata } from "next";
import Link from "next/link";

import {
  AddNoteForm,
  FollowUpForm,
} from "@/features/work-items/components/activity-forms";
import { ArchivedRecovery } from "@/features/work-items/components/archived-recovery";
import { AddToPlan } from "@/features/work-items/components/add-to-plan";
import { TicketWorkflowControls } from "@/features/work-items/components/ticket-workflow-controls";
import { formatDate, formatDateTime } from "@/features/work-items/date";
import {
  getWorkItem,
  getWorkItemActivity,
  getDefaultPlanDate,
} from "@/features/work-items/queries";
import { formatTicketNumber } from "@/shared/ticket-number";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Work details" };

const label = (value: string | null | undefined) =>
  value
    ? value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "—";

function Detail({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-quiet text-xs font-bold tracking-[0.08em] uppercase">
        {title}
      </dt>
      <dd className="text-ink mt-2 text-sm font-bold">{value}</dd>
    </div>
  );
}

export default async function WorkItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; from?: string }>;
}) {
  const [{ id }, { date, from }] = await Promise.all([params, searchParams]);
  const [item, activity, defaultPlanDate] = await Promise.all([
    getWorkItem(id),
    getWorkItemActivity(id),
    getDefaultPlanDate(),
  ]);
  const isTodayDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "");
  const todayDate = isTodayDate ? `?date=${date}` : "";
  const editTodayDate = isTodayDate ? `&date=${date}` : "";
  const backLink =
    from === "today"
      ? { href: `/today${todayDate}`, label: "Today" }
      : { href: "/work", label: "Work inventory" };
  const openFollowUp = activity.followUps.find(
    (followUp) => followUp.state === "open",
  );

  return (
    <>
      <PageHeader
        backLink={backLink}
        title={
          item.ticket_number
            ? `${formatTicketNumber(item.ticket_number)} · ${item.title}`
            : (item.title ?? "Work item")
        }
        titleSize="compact"
        description={`${label(item.kind)} · ${label(item.tracking_state)}`}
        action={
          item.tracking_state === "archived" ? (
            <ArchivedRecovery workItemId={id} />
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <AddToPlan defaultDate={defaultPlanDate} workItemId={id} />
              <Link
                href={
                  from === "today"
                    ? `/work/${id}/edit?from=today${editTodayDate}`
                    : `/work/${id}/edit`
                }
                className="bg-lavender-700 hover:bg-lavender-500 rounded-lg px-5 py-3 text-sm font-bold text-white"
              >
                Edit
              </Link>
            </div>
          )
        }
      />
      <div className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)_340px] gap-7 p-8">
        <div className="space-y-7">
          <section className="border-border/70 bg-paper shadow-surface rounded-xl border p-8">
            <h2 className="text-ink text-xl font-bold">Overview</h2>
            {item.kind === "ticket" ? (
              <div className="mt-7">
                <TicketWorkflowControls
                  operationalStatus={item.operational_status ?? "pending"}
                  systemPriority={item.system_priority ?? "medium"}
                  trackingState={item.tracking_state ?? "active"}
                  workItemId={id}
                />
              </div>
            ) : null}
            <dl className="mt-7 grid grid-cols-4 gap-x-6 gap-y-8">
              <Detail
                title="Type"
                value={item.ticket_type_name ?? label(item.kind)}
              />
              <Detail title="Received" value={formatDate(item.received_at)} />
              <Detail
                title="Due / remind"
                value={formatDateTime(item.remind_at ?? item.due_at)}
              />
              <Detail
                title="Form backup"
                value={
                  item.kind === "ticket"
                    ? item.form_backup_completed_at
                      ? "Complete"
                      : "Needed"
                    : "—"
                }
              />
            </dl>
            {item.description ? (
              <div className="border-border mt-8 border-t pt-7">
                <p className="text-quiet text-xs font-bold tracking-[0.08em] uppercase">
                  Notes
                </p>
                <p className="text-muted mt-3 text-sm leading-6 whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            ) : null}
            {item.external_url ? (
              <a
                href={item.external_url}
                target="_blank"
                rel="noreferrer"
                className="text-lavender-700 mt-6 inline-block text-sm font-bold"
              >
                Open ticket system ↗
              </a>
            ) : null}
          </section>

          <section className="border-border/70 bg-paper shadow-surface rounded-xl border p-8">
            <h2 className="text-ink text-xl font-bold">Days worked</h2>
            <p className="text-muted mt-1 text-sm">
              A calm record of the days this item received attention.
            </p>
            <div className="mt-6">
              {activity.workLogs.length ? (
                activity.workLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border-border flex items-center justify-between border-t py-4 first:border-t-0"
                  >
                    <div>
                      <p className="text-ink text-sm font-bold">
                        {formatDate(log.worked_on)}
                      </p>
                      <p className="text-quiet mt-1 text-xs">
                        {log.is_automatic
                          ? "Recorded from daily plan"
                          : "Recorded manually"}
                      </p>
                    </div>
                    <span className="bg-lavender-100 text-lavender-700 rounded-full px-3 py-1 text-xs font-bold">
                      {label(log.outcome)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-quiet py-6 text-sm">
                  No worked days recorded yet.
                </p>
              )}
            </div>
          </section>

          <section className="border-border/70 bg-paper shadow-surface rounded-xl border p-8">
            <h2 className="text-ink text-xl font-bold">Activity</h2>
            <div className="mt-6">
              <AddNoteForm workItemId={id} />
            </div>
            <div className="mt-7 space-y-5">
              {activity.notes.length ? (
                activity.notes.map((note) => (
                  <article
                    key={note.id}
                    className="border-border border-l-2 pl-5"
                  >
                    <p className="text-muted text-sm leading-6 whitespace-pre-wrap">
                      {note.body}
                    </p>
                    <p className="text-quiet mt-2 text-xs">
                      {formatDateTime(note.created_at)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-quiet text-sm">No activity notes yet.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-7">
          <FollowUpForm
            workItemId={id}
            current={
              openFollowUp
                ? {
                    id: openFollowUp.id,
                    reason: openFollowUp.reason,
                    review_on: openFollowUp.review_on,
                    waiting_on: openFollowUp.waiting_on,
                  }
                : undefined
            }
          />
          {activity.followUps.some((followUp) => followUp.state !== "open") ? (
            <section className="border-border/70 bg-paper shadow-surface rounded-xl border p-6">
              <h2 className="text-ink text-base font-bold">
                Follow-up history
              </h2>
              <div className="mt-5 space-y-5">
                {activity.followUps
                  .filter((followUp) => followUp.state !== "open")
                  .map((followUp) => (
                    <div key={followUp.id}>
                      <p className="text-muted text-sm leading-5">
                        {followUp.reason}
                      </p>
                      <p className="text-quiet mt-1 text-xs">
                        {label(followUp.state)} ·{" "}
                        {formatDateTime(followUp.completed_at)}
                      </p>
                    </div>
                  ))}
              </div>
            </section>
          ) : null}
          <section className="border-border/70 bg-paper shadow-surface rounded-xl border p-6">
            <h2 className="text-ink text-base font-bold">History</h2>
            <div className="mt-5 space-y-5">
              {activity.statusEvents.map((event) => (
                <div key={event.id}>
                  <p className="text-muted text-sm">
                    <span className="font-bold">
                      {label(event.status_dimension)}
                    </span>{" "}
                    changed to {label(event.to_value)}
                  </p>
                  <p className="text-quiet mt-1 text-xs">
                    {formatDateTime(event.changed_at)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

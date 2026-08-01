import type { Metadata } from "next";
import Link from "next/link";

import {
  AddNoteForm,
  FollowUpForm,
} from "@/features/work-items/components/activity-forms";
import { ArchivedRecovery } from "@/features/work-items/components/archived-recovery";
import { formatDate, formatDateTime } from "@/features/work-items/date";
import {
  getWorkItem,
  getWorkItemActivity,
} from "@/features/work-items/queries";
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, activity] = await Promise.all([
    getWorkItem(id),
    getWorkItemActivity(id),
  ]);
  const openFollowUp = activity.followUps.find(
    (followUp) => followUp.state === "open",
  );

  return (
    <>
      <PageHeader
        title={
          item.ticket_number
            ? `${item.ticket_number} · ${item.title}`
            : (item.title ?? "Work item")
        }
        description={`${label(item.kind)} · ${label(item.tracking_state)}`}
        action={
          item.tracking_state === "archived" ? (
            <ArchivedRecovery workItemId={id} />
          ) : (
            <Link
              href={`/work/${id}/edit`}
              className="bg-lavender-700 hover:bg-lavender-500 rounded-lg px-5 py-3 text-sm font-bold text-white"
            >
              Edit
            </Link>
          )
        }
      />
      <div className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)_340px] gap-7 p-8">
        <div className="space-y-7">
          <section className="border-border/70 bg-paper shadow-surface rounded-xl border p-8">
            <h2 className="text-ink text-xl font-bold">Overview</h2>
            <dl className="mt-7 grid grid-cols-3 gap-x-6 gap-y-8">
              <Detail
                title="Type"
                value={item.ticket_type_name ?? label(item.kind)}
              />
              <Detail
                title="Work status"
                value={label(item.operational_status)}
              />
              <Detail title="Priority" value={label(item.system_priority)} />
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

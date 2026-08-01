"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import type { CalendarDayView } from "@/features/calendar-sync/types";
import {
  movePlanItemAction,
  savePlanDetailsAction,
  setPlanSelectionAction,
} from "@/features/daily-planning/actions";
import { shouldShowCapacityReminder } from "@/features/daily-planning/capacity";
import type { WorkInventoryRow } from "@/features/work-items/types";
import { PageHeader } from "@/shared/ui/page-header";

type PlanningItem = WorkInventoryRow & {
  planItem: {
    id: string;
    position: number;
    execution_status: string;
    work_item_id: string;
  } | null;
};

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
type SavedFilter =
  "suggested" | "urgent" | "oldest" | "waiting" | "watching" | "unplanned";
type SortOption = "suggested" | "oldest" | "newest" | "priority" | "recent";

const savedFilters: { id: SavedFilter; label: string }[] = [
  { id: "suggested", label: "Suggested" },
  { id: "urgent", label: "Urgent" },
  { id: "oldest", label: "Oldest" },
  { id: "waiting", label: "Waiting" },
  { id: "watching", label: "Watching" },
  { id: "unplanned", label: "Unplanned" },
];

const pretty = (value: string | null | undefined) =>
  value
    ?.replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "—";

export function PlanBuilder({
  data,
  workDate,
}: {
  data: {
    calendar: CalendarDayView;
    dueFollowUps: number;
    items: PlanningItem[];
    nextWorkDate: string | null;
    previousWorkDate: string | null;
    plan: { id: string; status: string; intention: string | null } | null;
    schedule: {
      starts_at_local: string;
      ends_at_local: string;
      working_weekdays: number[];
    } | null;
    timeZone: string;
  };
  workDate: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [savedFilter, setSavedFilter] = useState<SavedFilter>("suggested");
  const [sort, setSort] = useState<SortOption>("suggested");
  const [kind, setKind] = useState("all");
  const [priority, setPriority] = useState("all");
  const [operational, setOperational] = useState("all");
  const [tracking, setTracking] = useState("all");
  const [ticketType, setTicketType] = useState("all");
  const [backup, setBackup] = useState("all");
  const [receivedBefore, setReceivedBefore] = useState("");
  const [reviewBefore, setReviewBefore] = useState("");
  const [intention, setIntention] = useState(data.plan?.intention ?? "");
  const [message, setMessage] = useState<string>();
  const meetings = data.calendar.meetings;
  const selected = data.items
    .filter((item) => item.planItem)
    .sort((a, b) => a.planItem!.position - b.planItem!.position);
  const ticketTypes = useMemo(
    () =>
      Array.from(
        new Map(
          data.items
            .filter((item) => item.ticket_type_id && item.ticket_type_name)
            .map((item) => [item.ticket_type_id!, item.ticket_type_name!]),
        ),
      ),
    [data.items],
  );

  useEffect(() => {
    const saved = window.sessionStorage.getItem("north-haven-plan-filters");
    if (!saved) return;
    const restore = window.setTimeout(() => {
      try {
        const value = JSON.parse(saved) as Record<string, string>;
        if (value.savedFilter) setSavedFilter(value.savedFilter as SavedFilter);
        if (value.sort) setSort(value.sort as SortOption);
        if (value.kind) setKind(value.kind);
        if (value.priority) setPriority(value.priority);
        if (value.operational) setOperational(value.operational);
        if (value.tracking) setTracking(value.tracking);
        if (value.ticketType) setTicketType(value.ticketType);
        if (value.backup) setBackup(value.backup);
      } catch {
        window.sessionStorage.removeItem("north-haven-plan-filters");
      }
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(
      "north-haven-plan-filters",
      JSON.stringify({
        backup,
        kind,
        operational,
        priority,
        savedFilter,
        sort,
        ticketType,
        tracking,
      }),
    );
  }, [
    backup,
    kind,
    operational,
    priority,
    savedFilter,
    sort,
    ticketType,
    tracking,
  ]);

  const available = useMemo(() => {
    const query = search.trim().toLowerCase();
    const chosenSort = savedFilter === "oldest" ? "oldest" : sort;
    return data.items
      .filter((item) => !item.planItem)
      .filter((item) => {
        if (
          query &&
          ![item.ticket_number, item.title, item.ticket_type_name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
          return false;
        if (kind !== "all" && item.kind !== kind) return false;
        if (priority !== "all" && item.system_priority !== priority)
          return false;
        if (operational !== "all" && item.operational_status !== operational)
          return false;
        if (tracking !== "all" && item.tracking_state !== tracking)
          return false;
        if (ticketType !== "all" && item.ticket_type_id !== ticketType)
          return false;
        if (backup === "missing" && item.form_backup_completed_at) return false;
        if (backup === "complete" && !item.form_backup_completed_at)
          return false;
        if (
          receivedBefore &&
          (!item.received_at || item.received_at > receivedBefore)
        )
          return false;
        if (
          reviewBefore &&
          (!item.next_review_on || item.next_review_on > reviewBefore)
        )
          return false;
        if (savedFilter === "urgent" && item.system_priority !== "urgent")
          return false;
        if (
          savedFilter === "waiting" &&
          item.operational_status !== "waiting_response"
        )
          return false;
        if (savedFilter === "watching" && item.tracking_state !== "watching")
          return false;
        return true;
      })
      .sort((a, b) => {
        if (query) {
          const exactA = itemNumber(a) === query ? 0 : 1;
          const exactB = itemNumber(b) === query ? 0 : 1;
          if (exactA !== exactB) return exactA - exactB;
        }
        if (chosenSort === "oldest")
          return (a.received_at ?? a.created_at ?? "").localeCompare(
            b.received_at ?? b.created_at ?? "",
          );
        if (chosenSort === "newest")
          return (b.received_at ?? b.created_at ?? "").localeCompare(
            a.received_at ?? a.created_at ?? "",
          );
        if (chosenSort === "recent")
          return (b.last_worked_on ?? "").localeCompare(a.last_worked_on ?? "");
        return (
          priorityOrder[a.system_priority ?? "medium"] -
            priorityOrder[b.system_priority ?? "medium"] ||
          (a.received_at ?? a.created_at ?? "").localeCompare(
            b.received_at ?? b.created_at ?? "",
          )
        );
      });
  }, [
    backup,
    data.items,
    kind,
    operational,
    priority,
    receivedBefore,
    reviewBefore,
    savedFilter,
    search,
    sort,
    ticketType,
    tracking,
  ]);

  function itemNumber(item: PlanningItem) {
    return item.ticket_number?.trim().toLowerCase() ?? "";
  }

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    setMessage(undefined);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Plan"
        description="Choose the work that deserves your attention."
        action={
          <button
            disabled={pending}
            onClick={() =>
              run(() =>
                savePlanDetailsAction({ intention, markReady: true, workDate }),
              )
            }
            className="bg-lavender-700 hover:bg-lavender-500 rounded-lg px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            Mark ready
          </button>
        }
      />
      <div className="mx-auto grid max-w-[1440px] grid-cols-[260px_minmax(0,1fr)] gap-7 p-8">
        <aside className="bg-lavender-50 self-start rounded-xl p-7">
          <label className="text-ink block text-sm font-bold">
            Work date
            <input
              type="date"
              value={workDate}
              onChange={(e) => router.push(`/plan?date=${e.target.value}`)}
              className="border-border bg-paper mt-2 w-full rounded-lg border px-3 py-2.5"
            />
          </label>
          <dl className="border-border mt-7 space-y-4 border-t pt-6 text-sm">
            <div>
              <dt className="text-quiet text-xs font-bold uppercase">
                Work schedule
              </dt>
              <dd className="mt-1 font-bold">
                {data.schedule
                  ? `${data.schedule.starts_at_local.slice(0, 5)}–${data.schedule.ends_at_local.slice(0, 5)}`
                  : "8:00–17:00"}
              </dd>
            </div>
            <div>
              <dt className="text-quiet text-xs font-bold uppercase">
                Plan state
              </dt>
              <dd className="mt-1 font-bold capitalize">
                {data.plan?.status ?? "Not started"}
              </dd>
            </div>
            <div>
              <dt className="text-quiet text-xs font-bold uppercase">
                Selected
              </dt>
              <dd className="mt-1 font-bold">{selected.length} items</dd>
            </div>
            <div>
              <dt className="text-quiet text-xs font-bold uppercase">
                Follow-ups due
              </dt>
              <dd className="mt-1 font-bold">{data.dueFollowUps}</dd>
            </div>
            <div>
              <dt className="text-quiet text-xs font-bold uppercase">
                Meetings
              </dt>
              <dd className="mt-1 font-bold">{meetings.length}</dd>
            </div>
          </dl>
          <div className="mt-7 flex items-center justify-between text-sm font-bold">
            {data.previousWorkDate ? (
              <Link
                href={`/plan?date=${data.previousWorkDate}`}
                className="text-lavender-700"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            {data.nextWorkDate ? (
              <Link
                href={`/plan?date=${data.nextWorkDate}`}
                className="text-lavender-700"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </aside>
        <main className="space-y-7">
          {data.calendar.isOutOfOffice ? (
            <div className="bg-lavender-100 text-lavender-700 rounded-xl px-6 py-5 text-sm">
              <strong>This is an Out of Office day.</strong> North Haven
              normally skips it when proposing work. You can still plan urgent
              work here explicitly.
            </div>
          ) : null}
          {data.calendar.connection &&
          data.calendar.connection.state !== "connected" ? (
            <div className="bg-waiting-surface text-waiting-ink rounded-xl px-6 py-5 text-sm">
              Calendar may be out of date. Manual planning continues normally.
            </div>
          ) : null}
          {message ? (
            <p
              role="alert"
              className="bg-urgent-surface text-urgent-ink rounded-lg px-4 py-3 text-sm"
            >
              {message}
            </p>
          ) : null}
          {shouldShowCapacityReminder(selected.length) ? (
            <div className="bg-waiting-surface text-waiting-ink rounded-xl px-6 py-5 text-sm">
              <strong>This plan has {selected.length} items.</strong> Your usual
              day contains 6-8. You can keep this plan or remove something.
            </div>
          ) : null}
          <section className="border-border/70 bg-paper shadow-surface rounded-xl border p-7">
            <div className="flex items-end gap-4">
              <label className="text-ink min-w-0 flex-1 text-sm font-bold">
                Daily intention
                <input
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  maxLength={240}
                  placeholder="What matters most this day?"
                  className="border-border mt-2 w-full rounded-lg border px-4 py-3"
                />
              </label>
              <button
                disabled={pending}
                onClick={() =>
                  run(() =>
                    savePlanDetailsAction({
                      intention,
                      markReady: false,
                      workDate,
                    }),
                  )
                }
                className="border-border text-muted min-h-11 rounded-lg border px-5 text-sm font-bold"
              >
                Save intention
              </button>
            </div>
          </section>
          {meetings.length ? (
            <section className="border-blush-200 bg-paper shadow-surface rounded-xl border p-7">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-ink text-xl font-bold">
                    Meetings on this day
                  </h2>
                  <p className="text-muted mt-1 text-sm">
                    Synced meetings appear automatically and do not consume
                    actionable-item capacity.
                  </p>
                </div>
                <span className="text-blush-600 text-sm font-bold">
                  {meetings.length}
                </span>
              </div>
              <div className="mt-5">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="border-blush-200 flex items-center gap-4 border-t py-4 first:border-t-0"
                  >
                    <span className="bg-blush-100 h-8 w-1 rounded-full" />
                    <div className="min-w-0">
                      <p className="text-ink truncate text-sm font-bold">
                        {meeting.title}
                      </p>
                      <p className="text-quiet mt-1 text-xs">
                        {new Intl.DateTimeFormat("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: data.timeZone,
                        }).format(new Date(meeting.startsAt))}
                      </p>
                    </div>
                    <span className="text-quiet ml-auto text-xs">
                      Google Calendar
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          <section className="border-border/70 bg-paper shadow-surface rounded-xl border p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-ink text-xl font-bold">
                Selected for this day
              </h2>
              <span className="text-quiet text-sm">{selected.length}</span>
            </div>
            <div className="mt-5">
              {selected.length ? (
                selected.map((item, index) => (
                  <div
                    key={item.id}
                    className="border-border flex items-center gap-4 border-t py-4 first:border-t-0"
                  >
                    <button
                      aria-label={`Remove ${item.title}`}
                      onClick={() =>
                        run(() =>
                          setPlanSelectionAction({
                            selected: false,
                            workDate,
                            workItemId: item.id!,
                          }),
                        )
                      }
                      className="border-lavender-500 bg-lavender-100 text-lavender-700 h-6 w-6 rounded border text-xs"
                    >
                      ✓
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-ink truncate text-sm font-bold">
                        {item.ticket_number ? `${item.ticket_number} · ` : ""}
                        {item.title}
                      </p>
                      <p className="text-quiet mt-1 text-xs capitalize">
                        {item.kind} · {item.system_priority ?? "normal"}
                      </p>
                    </div>
                    <button
                      disabled={index === 0}
                      onClick={() =>
                        run(() =>
                          movePlanItemAction({
                            direction: -1,
                            planItemId: item.planItem!.id,
                          }),
                        )
                      }
                      className="text-muted disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      disabled={index === selected.length - 1}
                      onClick={() =>
                        run(() =>
                          movePlanItemAction({
                            direction: 1,
                            planItemId: item.planItem!.id,
                          }),
                        )
                      }
                      className="text-muted disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-muted py-8 text-center text-sm">
                  Choose a few items below to create a clear plan.
                </p>
              )}
            </div>
          </section>
          <section className="border-border/70 bg-paper shadow-surface rounded-xl border">
            <div className="border-border border-b p-5">
              <div className="flex flex-wrap gap-2 pb-4">
                {savedFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setSavedFilter(filter.id)}
                    className={`rounded-full px-3.5 py-2 text-xs font-bold ${
                      savedFilter === filter.id
                        ? "bg-lavender-700 text-white"
                        : "bg-lavender-50 text-lavender-700"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search available work"
                  className="border-border bg-canvas min-w-0 flex-1 rounded-lg border px-4 py-2.5 text-sm"
                />
                <Link
                  href="/work/new/task"
                  className="text-lavender-700 text-sm font-bold"
                >
                  New task
                </Link>
                <Link
                  href="/work/new/reminder"
                  className="text-lavender-700 text-sm font-bold"
                >
                  New reminder
                </Link>
              </div>
              <details className="border-border mt-4 border-t pt-4">
                <summary className="text-muted cursor-pointer text-sm font-bold">
                  Filters and sorting
                </summary>
                <div className="mt-4 grid grid-cols-4 gap-3">
                  <select
                    aria-label="Sort available work"
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value as SortOption)
                    }
                    className="border-border bg-paper rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <option value="suggested">Suggested order</option>
                    <option value="oldest">Oldest first</option>
                    <option value="newest">Newest first</option>
                    <option value="priority">Priority</option>
                    <option value="recent">Recently worked</option>
                  </select>
                  <select
                    aria-label="Work type"
                    value={kind}
                    onChange={(event) => setKind(event.target.value)}
                    className="border-border bg-paper rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <option value="all">All work types</option>
                    <option value="ticket">Tickets</option>
                    <option value="task">Tasks</option>
                    <option value="reminder">Reminders</option>
                  </select>
                  <select
                    aria-label="Priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="border-border bg-paper rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <option value="all">All priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select
                    aria-label="Operational status"
                    value={operational}
                    onChange={(event) => setOperational(event.target.value)}
                    className="border-border bg-paper rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In progress</option>
                    <option value="waiting_response">Waiting response</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <select
                    aria-label="Tracking state"
                    value={tracking}
                    onChange={(event) => setTracking(event.target.value)}
                    className="border-border bg-paper rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <option value="all">All tracking</option>
                    <option value="active">Active</option>
                    <option value="watching">Watching</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select
                    aria-label="Ticket type"
                    value={ticketType}
                    onChange={(event) => setTicketType(event.target.value)}
                    className="border-border bg-paper rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <option value="all">All ticket types</option>
                    {ticketTypes.map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Backup status"
                    value={backup}
                    onChange={(event) => setBackup(event.target.value)}
                    className="border-border bg-paper rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <option value="all">Any backup status</option>
                    <option value="missing">Backup missing</option>
                    <option value="complete">Backup complete</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setKind("all");
                      setPriority("all");
                      setOperational("all");
                      setTracking("all");
                      setTicketType("all");
                      setBackup("all");
                      setReceivedBefore("");
                      setReviewBefore("");
                    }}
                    className="border-border text-muted rounded-lg border px-3 py-2.5 text-sm font-bold"
                  >
                    Clear filters
                  </button>
                  <label className="text-quiet text-xs font-bold">
                    Received on or before
                    <input
                      type="date"
                      value={receivedBefore}
                      onChange={(event) =>
                        setReceivedBefore(event.target.value)
                      }
                      className="border-border text-ink mt-1 block w-full rounded-lg border px-3 py-2"
                    />
                  </label>
                  <label className="text-quiet text-xs font-bold">
                    Review due by
                    <input
                      type="date"
                      value={reviewBefore}
                      onChange={(event) => setReviewBefore(event.target.value)}
                      className="border-border text-ink mt-1 block w-full rounded-lg border px-3 py-2"
                    />
                  </label>
                </div>
              </details>
            </div>
            <div className="max-h-[520px] overflow-y-auto px-6">
              {available.map((item) => (
                <div
                  key={item.id}
                  className="border-border flex items-center gap-4 border-t py-4 first:border-t-0"
                >
                  <button
                    aria-label={`Add ${item.title}`}
                    onClick={() =>
                      run(() =>
                        setPlanSelectionAction({
                          selected: true,
                          workDate,
                          workItemId: item.id!,
                        }),
                      )
                    }
                    className="border-lavender-300 hover:bg-lavender-50 h-6 w-6 rounded border"
                  />
                  <div>
                    <p className="text-ink text-sm font-bold">
                      {item.ticket_number ? `${item.ticket_number} · ` : ""}
                      {item.title}
                    </p>
                    <p className="text-quiet mt-1 text-xs capitalize">
                      {pretty(item.kind)} · {pretty(item.operational_status)} ·{" "}
                      {pretty(item.system_priority)}
                    </p>
                  </div>
                </div>
              ))}
              {!available.length ? (
                <p className="text-muted py-12 text-center text-sm">
                  No unplanned work matches these filters.
                </p>
              ) : null}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

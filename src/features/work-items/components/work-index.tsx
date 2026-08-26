"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  bulkAddToPlanAction,
  bulkArchiveWorkItemsAction,
  bulkDeleteWorkItemsAction,
  bulkSetReviewDateAction,
  deleteWorkItemAction,
} from "@/features/work-items/actions";
import { BulkTicketImportDialog } from "@/features/work-items/components/bulk-ticket-import-dialog";
import { formatDate, formatDateTime } from "@/features/work-items/date";
import type {
  TicketTypeOption,
  WorkInventoryRow,
} from "@/features/work-items/types";
import { formatTicketNumber } from "@/shared/ticket-number";
import { PageHeader } from "@/shared/ui/page-header";

type SavedView =
  "active" | "waiting" | "watching" | "backup" | "closed" | "archived" | "all";

const savedViews: { id: SavedView; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "waiting", label: "Waiting for response" },
  { id: "watching", label: "Watching" },
  { id: "backup", label: "Missing backup" },
  { id: "closed", label: "Closed" },
  { id: "archived", label: "Archived" },
  { id: "all", label: "All work" },
];

const label = (value: string | null | undefined) =>
  value
    ? value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "—";

type ConfirmationRequest =
  | {
      action: "archive";
      ids: string[];
      title: string;
    }
  | {
      action: "delete";
      ids: string[];
      title: string;
    };

function matchesView(item: WorkInventoryRow, view: SavedView) {
  if (view === "active")
    return (
      item.tracking_state === "active" || item.tracking_state === "watching"
    );
  if (view === "waiting") return item.operational_status === "waiting_response";
  if (view === "watching") return item.tracking_state === "watching";
  if (view === "backup")
    return (
      item.kind === "ticket" &&
      !item.form_backup_completed_at &&
      item.tracking_state !== "archived"
    );
  if (view === "closed") return item.tracking_state === "closed";
  if (view === "archived") return item.tracking_state === "archived";
  return true;
}

function ageInDays(value: string | null) {
  if (!value) return "—";
  const days = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(`${value}T00:00:00`).getTime()) / 86_400_000,
    ),
  );
  return `${days}d`;
}

export function WorkIndex({
  items,
  ticketTypes,
}: {
  items: WorkInventoryRow[];
  ticketTypes: TicketTypeOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedView, setSavedView] = useState<SavedView>("active");
  const [kind, setKind] = useState("all");
  const [priority, setPriority] = useState("all");
  const [operational, setOperational] = useState("all");
  const [tracking, setTracking] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [planDate, setPlanDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [reviewDate, setReviewDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  }>();
  const [confirmation, setConfirmation] =
    useState<ConfirmationRequest | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = window.sessionStorage.getItem("north-haven-work-filters");
    if (!saved) return;
    const restore = window.setTimeout(() => {
      try {
        const value = JSON.parse(saved) as Record<string, string>;
        if (value.savedView) setSavedView(value.savedView as SavedView);
        if (value.kind) setKind(value.kind);
        if (value.priority) setPriority(value.priority);
        if (value.operational) setOperational(value.operational);
        if (value.tracking) setTracking(value.tracking);
      } catch {
        window.sessionStorage.removeItem("north-haven-work-filters");
      }
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(
      "north-haven-work-filters",
      JSON.stringify({ kind, operational, priority, savedView, tracking }),
    );
  }, [kind, operational, priority, savedView, tracking]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches(
        "input, textarea, select, [contenteditable='true']",
      );
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        savedViews.map((view) => [
          view.id,
          items.filter((item) => matchesView(item, view.id)).length,
        ]),
      ),
    [items],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return items
      .filter((item) => {
        const searchable = [
          item.ticket_number,
          item.title,
          item.ticket_type_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();
        return (
          matchesView(item, savedView) &&
          (kind === "all" || item.kind === kind) &&
          (priority === "all" || item.system_priority === priority) &&
          (operational === "all" || item.operational_status === operational) &&
          (tracking === "all" || item.tracking_state === tracking) &&
          (!query || searchable.includes(query))
        );
      })
      .sort((a, b) => {
        if (query) {
          const exactA = a.ticket_number?.toLowerCase() === query ? 0 : 1;
          const exactB = b.ticket_number?.toLowerCase() === query ? 0 : 1;
          if (exactA !== exactB) return exactA - exactB;
        }
        return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
      });
  }, [items, kind, operational, priority, savedView, search, tracking]);

  const selectableIds = filteredItems
    .filter((item) => item.tracking_state !== "archived")
    .map((item) => item.id)
    .filter((id): id is string => Boolean(id));
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selected.includes(id));

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    setMessage(undefined);
    startTransition(async () => {
      const result = await action();
      setMessage({
        tone: result.ok ? "success" : "error",
        text: result.message,
      });
      if (result.ok) setSelected([]);
      router.refresh();
    });
  }

  function confirmPendingAction() {
    if (!confirmation) return;
    const request = confirmation;
    setConfirmation(null);
    run(() =>
      request.action === "archive"
        ? bulkArchiveWorkItemsAction({ workItemIds: request.ids })
        : request.ids.length === 1
          ? deleteWorkItemAction({ workItemId: request.ids[0]! })
          : bulkDeleteWorkItemsAction({ workItemIds: request.ids }),
    );
  }

  function itemDisplayName(item: WorkInventoryRow) {
    return `${item.ticket_number ? `${formatTicketNumber(item.ticket_number)} · ` : ""}${item.title}`;
  }

  function clearFilters() {
    setKind("all");
    setPriority("all");
    setOperational("all");
    setTracking("all");
    setSearch("");
  }

  return (
    <>
      <PageHeader
        title="Work inventory"
        description="Everything stays here. Today only shows what you deliberately plan."
        action={
          <div className="flex items-center gap-3">
            <BulkTicketImportDialog
              existingTicketNumbers={items
                .map((item) => item.ticket_number)
                .filter((value): value is string => Boolean(value))}
              ticketTypes={ticketTypes}
            />
            <Link
              href="/work/new/task"
              className="border-border bg-paper text-muted hover:text-ink rounded-lg border px-4 py-3 text-sm font-bold"
            >
              New task
            </Link>
            <Link
              href="/work/new/reminder"
              className="border-border bg-paper text-muted hover:text-ink rounded-lg border px-4 py-3 text-sm font-bold"
            >
              New reminder
            </Link>
            <Link
              href="/work/new/ticket"
              className="bg-lavender-700 hover:bg-lavender-500 rounded-lg px-5 py-3 text-sm font-bold text-white"
            >
              New ticket
            </Link>
          </div>
        }
      />

      <div className="mx-auto grid max-w-[1540px] grid-cols-[230px_minmax(0,1fr)] gap-7 p-8">
        <aside className="border-border/70 bg-paper shadow-surface self-start rounded-xl border p-4">
          <p className="text-quiet px-3 pb-3 text-xs font-bold tracking-[0.12em] uppercase">
            Saved views
          </p>
          <nav aria-label="Work inventory views" className="space-y-1">
            {savedViews.map((view) => {
              const current = savedView === view.id;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => {
                    setSavedView(view.id);
                    setSelected([]);
                  }}
                  aria-current={current ? "page" : undefined}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-bold ${current ? "bg-lavender-100 text-lavender-700" : "text-muted hover:bg-lavender-50 hover:text-ink"}`}
                >
                  <span>{view.label}</span>
                  <span className="text-quiet text-xs">{counts[view.id]}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="border-border/70 bg-paper shadow-surface min-h-[520px] min-w-0 rounded-xl border">
          <div className="border-border space-y-3 border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <label className="sr-only" htmlFor="work-search">
                  Search work
                </label>
                <input
                  ref={searchRef}
                  id="work-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search ticket number, title, or type"
                  className="border-border bg-canvas text-ink placeholder:text-quiet focus:border-lavender-500 w-full rounded-lg border py-2.5 pr-11 pl-4 text-sm outline-none"
                />
                <kbd className="border-border bg-paper text-quiet pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border px-1.5 py-0.5 text-[10px] font-bold">
                  /
                </kbd>
              </div>
              <select
                aria-label="Work type"
                value={kind}
                onChange={(event) => setKind(event.target.value)}
                className="border-border bg-paper text-muted rounded-lg border px-3 py-2.5 text-sm font-bold"
              >
                <option value="all">All types</option>
                <option value="ticket">Tickets</option>
                <option value="task">Tasks</option>
                <option value="reminder">Reminders</option>
              </select>
              <select
                aria-label="Priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="border-border bg-paper text-muted rounded-lg border px-3 py-2.5 text-sm font-bold"
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
                className="border-border bg-paper text-muted rounded-lg border px-3 py-2.5 text-sm font-bold"
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
                className="border-border bg-paper text-muted rounded-lg border px-3 py-2.5 text-sm font-bold"
              >
                <option value="all">All tracking</option>
                <option value="active">Active</option>
                <option value="watching">Watching</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            {kind !== "all" ||
            priority !== "all" ||
            operational !== "all" ||
            tracking !== "all" ||
            search ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-lavender-700 text-xs font-bold"
              >
                Clear filters
              </button>
            ) : null}
            {message ? (
              <p
                role="status"
                className={`rounded-lg px-4 py-3 text-sm ${message.tone === "success" ? "bg-success-surface text-success-ink" : "bg-urgent-surface text-urgent-ink"}`}
              >
                {message.text}
              </p>
            ) : null}
          </div>

          {selected.length ? (
            <div className="border-border bg-lavender-50 flex flex-wrap items-end gap-3 border-b px-6 py-4">
              <p className="text-lavender-700 mr-auto self-center text-sm font-bold">
                {selected.length} selected
              </p>
              <label className="text-quiet text-xs font-bold">
                Plan date
                <input
                  type="date"
                  value={planDate}
                  onChange={(event) => setPlanDate(event.target.value)}
                  className="border-border bg-paper text-ink mt-1 block rounded-lg border px-3 py-2"
                />
              </label>
              <button
                disabled={pending}
                onClick={() =>
                  run(() =>
                    bulkAddToPlanAction({
                      workDate: planDate,
                      workItemIds: selected,
                    }),
                  )
                }
                className="border-lavender-300 text-lavender-700 bg-paper rounded-lg border px-4 py-2.5 text-sm font-bold disabled:opacity-50"
              >
                Add to plan
              </button>
              <label className="text-quiet text-xs font-bold">
                Review date
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(event) => setReviewDate(event.target.value)}
                  className="border-border bg-paper text-ink mt-1 block rounded-lg border px-3 py-2"
                />
              </label>
              <button
                disabled={pending}
                onClick={() =>
                  run(() =>
                    bulkSetReviewDateAction({
                      reviewOn: reviewDate,
                      workItemIds: selected,
                    }),
                  )
                }
                className="border-border text-muted bg-paper rounded-lg border px-4 py-2.5 text-sm font-bold disabled:opacity-50"
              >
                Set review
              </button>
              <button
                disabled={pending}
                onClick={() =>
                  setConfirmation({
                    action: "archive",
                    ids: selected,
                    title: `${selected.length} selected ${selected.length === 1 ? "item" : "items"}`,
                  })
                }
                className="text-urgent-ink border-urgent-ink/20 bg-paper rounded-lg border px-4 py-2.5 text-sm font-bold disabled:opacity-50"
              >
                Archive
              </button>
              <button
                disabled={pending}
                onClick={() =>
                  setConfirmation({
                    action: "delete",
                    ids: selected,
                    title: `${selected.length} selected ${selected.length === 1 ? "item" : "items"}`,
                  })
                }
                className="bg-urgent-surface text-urgent-ink border-urgent-ink/20 rounded-lg border px-4 py-2.5 text-sm font-bold disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          ) : null}

          {filteredItems.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] border-collapse text-left">
                <thead>
                  <tr className="border-border text-quiet border-b text-xs tracking-[0.08em] uppercase">
                    <th className="px-4 py-4">
                      <input
                        type="checkbox"
                        aria-label="Select all visible work"
                        checked={allSelected}
                        onChange={() =>
                          setSelected(
                            allSelected
                              ? selected.filter(
                                  (id) => !selectableIds.includes(id),
                                )
                              : Array.from(
                                  new Set([...selected, ...selectableIds]),
                                ),
                          )
                        }
                      />
                    </th>
                    <th className="px-4 py-4 font-bold">Work item</th>
                    <th className="px-4 py-4 font-bold">Received / age</th>
                    <th className="px-4 py-4 font-bold">Priority</th>
                    <th className="px-4 py-4 font-bold">Operational</th>
                    <th className="px-4 py-4 font-bold">Tracking</th>
                    <th className="px-4 py-4 font-bold">Next review</th>
                    <th className="px-4 py-4 font-bold">Backup</th>
                    <th className="px-4 py-4 font-bold">Last worked</th>
                    <th className="px-4 py-4 font-bold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const id = item.id!;
                    const checked = selected.includes(id);
                    return (
                      <tr
                        key={id}
                        className="border-border/70 hover:bg-lavender-50 border-b last:border-b-0"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            aria-label={`Select ${item.title}`}
                            disabled={item.tracking_state === "archived"}
                            checked={checked}
                            onChange={() =>
                              setSelected(
                                checked
                                  ? selected.filter((value) => value !== id)
                                  : [...selected, id],
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/work/${id}`}
                            className="text-ink hover:text-lavender-700 block font-bold"
                          >
                            {item.ticket_number
                              ? `${formatTicketNumber(item.ticket_number)} · `
                              : ""}
                            {item.title}
                          </Link>
                          <p className="text-quiet mt-1 text-xs">
                            {label(item.kind)}
                            {item.ticket_type_name
                              ? ` · ${item.ticket_type_name}`
                              : ""}
                          </p>
                        </td>
                        <td className="text-muted px-4 py-4 text-sm">
                          {item.kind === "ticket" ? (
                            <>
                              <span>{formatDate(item.received_at)}</span>
                              <span className="text-quiet mt-1 block text-xs">
                                {ageInDays(item.received_at)}
                              </span>
                            </>
                          ) : (
                            formatDateTime(item.remind_at ?? item.due_at)
                          )}
                        </td>
                        <td className="text-muted px-4 py-4 text-sm">
                          {label(item.system_priority)}
                        </td>
                        <td className="text-muted px-4 py-4 text-sm">
                          {item.kind === "ticket"
                            ? label(item.operational_status)
                            : "—"}
                        </td>
                        <td className="px-4 py-4">
                          <span className="bg-lavender-100 text-lavender-700 rounded-full px-3 py-1 text-xs font-bold">
                            {label(item.tracking_state)}
                          </span>
                        </td>
                        <td className="text-muted px-4 py-4 text-sm">
                          {formatDate(item.next_review_on)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {item.kind !== "ticket" ? (
                            "—"
                          ) : item.form_backup_completed_at ? (
                            <span className="text-success-ink font-bold">
                              Complete
                            </span>
                          ) : (
                            <span className="text-waiting-ink font-bold">
                              Needed
                            </span>
                          )}
                        </td>
                        <td className="text-muted px-4 py-4 text-sm">
                          {formatDate(item.last_worked_on)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {item.tracking_state !== "archived" ? (
                              <button
                                type="button"
                                disabled={pending}
                                aria-label={`Archive ${item.title}`}
                                title="Archive"
                                onClick={() =>
                                  setConfirmation({
                                    action: "archive",
                                    ids: [id],
                                    title: itemDisplayName(item),
                                  })
                                }
                                className="text-quiet hover:text-lavender-700 focus-visible:ring-lavender-500 rounded p-1.5 text-xs font-bold outline-none focus-visible:ring-2 disabled:opacity-40"
                              >
                                Archive
                              </button>
                            ) : null}
                          <button
                            type="button"
                            disabled={pending}
                            aria-label={`Delete ${item.title}`}
                            title="Delete"
                            onClick={() =>
                              setConfirmation({
                                action: "delete",
                                ids: [id],
                                title: itemDisplayName(item),
                              })
                            }
                            className="text-quiet hover:text-urgent-ink focus-visible:ring-urgent-ink rounded p-1.5 outline-none focus-visible:ring-2 disabled:opacity-40"
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            >
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v5" />
                              <path d="M14 11v5" />
                            </svg>
                          </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-[390px] flex-col items-center justify-center px-8 text-center">
              <p className="text-ink text-lg font-bold">
                Nothing is asking for your attention here.
              </p>
              <p className="text-muted mt-2 max-w-md text-sm leading-6">
                Change the view or filters, or add the next piece of work when
                you are ready.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-lavender-700 mt-4 text-sm font-bold"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>

      {confirmation ? (
        <div
          role="presentation"
          className="bg-ink/25 fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmation(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="work-confirm-title"
            className="border-border bg-paper shadow-surface w-full max-w-[560px] overflow-hidden rounded-2xl border"
          >
            <div className="border-blush-200 bg-lavender-100 border-b-2 px-7 py-6">
              <p className="text-quiet text-xs font-bold tracking-[0.12em] uppercase">
                {confirmation.action === "archive"
                  ? "Archive work"
                  : "Permanent delete"}
              </p>
              <h2
                id="work-confirm-title"
                className="text-ink mt-2 text-2xl font-bold tracking-[-0.03em]"
              >
                {confirmation.action === "archive"
                  ? "Move this out of active work?"
                  : "Delete this forever?"}
              </h2>
            </div>
            <div className="space-y-4 px-7 py-6">
              <p className="text-muted text-sm leading-6">
                <span className="text-ink font-bold">{confirmation.title}</span>
                {confirmation.action === "archive"
                  ? " will leave active views, but stays recoverable from Archived."
                  : " will be permanently removed from North Haven, including related notes, plans, and history. This cannot be undone."}
              </p>
              {confirmation.action === "delete" ? (
                <div className="bg-urgent-surface text-urgent-ink rounded-xl px-4 py-3 text-sm font-bold">
                  Delete is permanent. Use Archive if you might need this work
                  item later.
                </div>
              ) : null}
            </div>
            <div className="border-border bg-canvas flex justify-end gap-3 border-t px-7 py-5">
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="border-border bg-paper text-muted hover:text-ink rounded-lg border px-4 py-2.5 text-sm font-bold"
              >
                Keep it
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={confirmPendingAction}
                className={`rounded-lg px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${
                  confirmation.action === "archive"
                    ? "bg-lavender-700 hover:bg-lavender-500"
                    : "bg-urgent-ink hover:opacity-90"
                }`}
              >
                {confirmation.action === "archive"
                  ? "Archive"
                  : "Delete permanently"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

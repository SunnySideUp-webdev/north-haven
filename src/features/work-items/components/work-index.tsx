"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { formatDate, formatDateTime } from "@/features/work-items/date";
import type { WorkInventoryRow } from "@/features/work-items/types";
import { PageHeader } from "@/shared/ui/page-header";

type SavedView =
  "active" | "waiting" | "watching" | "backup" | "closed" | "all";

const savedViews: { id: SavedView; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "waiting", label: "Waiting for response" },
  { id: "watching", label: "Watching" },
  { id: "backup", label: "Missing backup" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All work" },
];

const label = (value: string | null | undefined) =>
  value
    ? value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "—";

function matchesView(item: WorkInventoryRow, view: SavedView) {
  if (view === "active") return item.tracking_state === "active";
  if (view === "waiting") return item.operational_status === "waiting_response";
  if (view === "watching") return item.tracking_state === "watching";
  if (view === "backup") {
    return (
      item.kind === "ticket" &&
      !item.form_backup_completed_at &&
      item.tracking_state !== "archived"
    );
  }
  if (view === "closed") return item.tracking_state === "closed";
  return true;
}

export function WorkIndex({ items }: { items: WorkInventoryRow[] }) {
  const [savedView, setSavedView] = useState<SavedView>("active");
  const [kind, setKind] = useState("all");
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

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
    return items.filter((item) => {
      const matchesKind = kind === "all" || item.kind === kind;
      const searchable = [item.ticket_number, item.title, item.ticket_type_name]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return (
        matchesView(item, savedView) &&
        matchesKind &&
        (!query || searchable.includes(query))
      );
    });
  }, [items, kind, savedView, search]);

  return (
    <>
      <PageHeader
        title="Work inventory"
        description="Everything stays here. Today only shows what you deliberately plan."
        action={
          <div className="flex items-center gap-3">
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

      <div className="mx-auto grid max-w-[1440px] grid-cols-[230px_minmax(0,1fr)] gap-7 p-8">
        <aside className="border-border/70 bg-paper shadow-surface self-start rounded-xl border p-4">
          <p className="text-quiet px-3 pb-3 text-xs font-bold tracking-[0.12em] uppercase">
            Saved views
          </p>
          <nav aria-label="Work inventory views" className="space-y-1">
            {savedViews.map((view) => {
              const selected = savedView === view.id;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setSavedView(view.id)}
                  aria-current={selected ? "page" : undefined}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-bold ${
                    selected
                      ? "bg-lavender-100 text-lavender-700"
                      : "text-muted hover:bg-lavender-50 hover:text-ink"
                  }`}
                >
                  <span>{view.label}</span>
                  <span className="text-quiet text-xs">{counts[view.id]}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="border-border/70 bg-paper shadow-surface min-h-[520px] rounded-xl border">
          <div className="border-border flex items-center gap-4 border-b px-6 py-5">
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
                placeholder="Search ticket number or title"
                className="border-border bg-canvas text-ink placeholder:text-quiet focus:border-lavender-500 w-full rounded-lg border py-2.5 pr-11 pl-4 text-sm outline-none"
              />
              <kbd className="border-border bg-paper text-quiet pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border px-1.5 py-0.5 text-[10px] font-bold">
                /
              </kbd>
            </div>
            <label className="sr-only" htmlFor="kind-filter">
              Work type
            </label>
            <select
              id="kind-filter"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              className="border-border bg-paper text-muted rounded-lg border px-4 py-2.5 text-sm font-bold"
            >
              <option value="all">All types</option>
              <option value="ticket">Tickets</option>
              <option value="task">Tasks</option>
              <option value="reminder">Reminders</option>
            </select>
          </div>

          {filteredItems.length ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-border text-quiet border-b text-xs tracking-[0.08em] uppercase">
                    <th className="px-6 py-4 font-bold">Work item</th>
                    <th className="px-4 py-4 font-bold">Status</th>
                    <th className="px-4 py-4 font-bold">Priority</th>
                    <th className="px-4 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Tracking</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-border/70 hover:bg-lavender-50 border-b last:border-b-0"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/work/${item.id}`}
                          className="text-ink hover:text-lavender-700 block font-bold"
                        >
                          {item.ticket_number ? `${item.ticket_number} · ` : ""}
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
                        {item.kind === "ticket"
                          ? label(item.operational_status)
                          : "—"}
                      </td>
                      <td className="text-muted px-4 py-4 text-sm">
                        {label(item.system_priority)}
                      </td>
                      <td className="text-muted px-4 py-4 text-sm">
                        {item.kind === "ticket"
                          ? formatDate(item.received_at)
                          : formatDateTime(item.remind_at ?? item.due_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-lavender-100 text-lavender-700 rounded-full px-3 py-1 text-xs font-bold">
                          {label(item.tracking_state)}
                        </span>
                        {item.kind === "ticket" &&
                        !item.form_backup_completed_at ? (
                          <span className="text-waiting-ink ml-2 text-xs font-bold">
                            Backup needed
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
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
            </div>
          )}
        </section>
      </div>
    </>
  );
}

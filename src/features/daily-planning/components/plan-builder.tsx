"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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

export function PlanBuilder({
  data,
  workDate,
}: {
  data: {
    dueFollowUps: number;
    items: PlanningItem[];
    nextWorkDate: string | null;
    plan: { id: string; status: string; intention: string | null } | null;
  };
  workDate: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [intention, setIntention] = useState(data.plan?.intention ?? "");
  const [message, setMessage] = useState<string>();
  const selected = data.items
    .filter((item) => item.planItem)
    .sort((a, b) => a.planItem!.position - b.planItem!.position);
  const available = useMemo(
    () =>
      data.items
        .filter((item) => !item.planItem)
        .filter((item) =>
          [item.ticket_number, item.title]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .sort(
          (a, b) =>
            priorityOrder[a.system_priority ?? "medium"] -
              priorityOrder[b.system_priority ?? "medium"] ||
            (a.received_at ?? "").localeCompare(b.received_at ?? ""),
        ),
    [data.items, search],
  );

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
          </dl>
          {data.nextWorkDate ? (
            <Link
              href={`/plan?date=${data.nextWorkDate}`}
              className="text-lavender-700 mt-7 block text-sm font-bold"
            >
              Next workday →
            </Link>
          ) : null}
        </aside>
        <main className="space-y-7">
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
            <div className="border-border flex items-center gap-4 border-b p-5">
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
                      {item.kind} ·{" "}
                      {item.operational_status?.replaceAll("_", " ") ??
                        "Ready to plan"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

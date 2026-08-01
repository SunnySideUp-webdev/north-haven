"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setPlanItemDoneAction } from "@/features/daily-planning/actions";
import type { WorkInventoryRow } from "@/features/work-items/types";
import { PageHeader } from "@/shared/ui/page-header";

type TodayItem = WorkInventoryRow & {
  planItem: { id: string; position: number; execution_status: string } | null;
};

export function DailyToday({
  data,
  workDate,
}: {
  data: {
    dueFollowUps: number;
    items: TodayItem[];
    plan: { id: string; status: string; intention: string | null } | null;
  };
  workDate: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const items = data.items
    .filter((item) => item.planItem)
    .sort((a, b) => a.planItem!.position - b.planItem!.position);
  const tickets = items.filter((item) => item.kind === "ticket");
  const others = items.filter((item) => item.kind !== "ticket");
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

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${workDate}T12:00:00Z`));
  return (
    <>
      <PageHeader
        title="Today"
        align="center"
        description={`${dateLabel} · ${data.plan ? `${data.plan.status[0].toUpperCase()}${data.plan.status.slice(1)} plan` : "No plan yet"}`}
        intention={data.plan?.intention ?? undefined}
      />
      {!items.length ? (
        <div className="mx-auto max-w-[980px] p-8">
          <section className="border-border/70 bg-paper shadow-surface flex min-h-[520px] flex-col items-center justify-center rounded-xl border px-10 text-center">
            <h2 className="text-ink text-2xl font-bold">
              Nothing is planned for today.
            </h2>
            <p className="text-muted mt-3 max-w-lg text-sm leading-6">
              Choose a few items from your work inventory to create a clear
              plan.
            </p>
            <div className="mt-7 flex gap-3">
              <Link
                href={`/plan?date=${workDate}`}
                className="bg-lavender-700 rounded-lg px-6 py-3 text-sm font-bold text-white"
              >
                Plan today
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
            <dl className="mt-7 space-y-4 text-sm">
              <div>{tickets.length} tickets</div>
              <div>{others.length} tasks and reminders</div>
              <div>{data.dueFollowUps} follow-ups due</div>
            </dl>
            <div className="border-border mt-8 border-t pt-7">
              <p className="text-quiet text-xs font-bold uppercase">Progress</p>
              <p className="text-ink mt-3 text-xl font-bold">
                {completed} of {items.length}
              </p>
              <div className="bg-paper mt-3 h-2 overflow-hidden rounded-full">
                <div
                  className="bg-lavender-300 h-full"
                  style={{
                    width: `${items.length ? (completed / items.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="mt-auto space-y-3">
              <Link
                href={`/end-of-day?date=${workDate}`}
                className="bg-lavender-700 block rounded-lg px-5 py-3 text-center text-sm font-bold text-white"
              >
                Start End of Day
              </Link>
              <Link
                href={`/plan?date=${workDate}`}
                className="border-lavender-500 text-lavender-700 block rounded-lg border px-5 py-3 text-center text-sm font-bold"
              >
                Edit today&apos;s plan
              </Link>
            </div>
          </aside>
          <section className="border-border/70 bg-paper shadow-surface rounded-xl border p-8">
            <h2 className="text-ink text-xl font-bold">Work plan</h2>
            <div className="mt-5">
              {[...tickets, ...others].map((item) => {
                const done = item.planItem?.execution_status === "done";
                return (
                  <article
                    key={item.id}
                    className="border-border flex items-center gap-5 border-t py-5 first:border-t-0"
                  >
                    <button
                      disabled={pending}
                      onClick={() => toggle(item)}
                      aria-label={`${done ? "Reopen" : "Mark"} ${item.title} ${done ? "" : "done"}`}
                      className={`h-6 w-6 rounded border ${done ? "bg-lavender-300 border-lavender-500 text-lavender-700" : "border-lavender-300"}`}
                    >
                      {done ? "✓" : ""}
                    </button>
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`text-sm font-bold ${done ? "text-quiet line-through" : "text-ink"}`}
                      >
                        {item.ticket_number ? `${item.ticket_number} · ` : ""}
                        {item.title}
                      </h3>
                      <p className="text-quiet mt-1 text-xs capitalize">
                        {item.kind} ·{" "}
                        {item.system_priority ?? item.tracking_state}
                      </p>
                    </div>
                    <Link
                      href={`/work/${item.id}`}
                      className="text-lavender-700 text-xs font-bold"
                    >
                      Details
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  buildInsightBuckets,
  getInsightSummary,
  periodLabel,
  type InsightBucket,
} from "@/features/reporting/insights";
import type { InsightsView } from "@/features/reporting/types";

function plural(value: number, label: string) {
  return `${value} ${label}${value === 1 ? "" : "s"}`;
}

function changeText(current: number, previous: number) {
  const difference = current - previous;
  if (!difference) return "Same as the previous period";
  return `${Math.abs(difference)} ${difference > 0 ? "more" : "fewer"} than the previous period`;
}

function insightsUrl(values: Record<string, string>) {
  return `/insights?${new URLSearchParams(values).toString()}`;
}

function Metric({
  definition,
  detail,
  label,
  tone = "lavender",
  value,
}: {
  definition: string;
  detail: string;
  label: string;
  tone?: "blush" | "lavender";
  value: string | number;
}) {
  return (
    <article
      aria-label={`${label}: ${value}. ${definition}`}
      className={`${tone === "blush" ? "bg-blush-50" : "bg-lavender-50"} rounded-xl p-5`}
    >
      <p className="text-muted text-sm">{label}</p>
      <p className="text-ink mt-3 text-[32px] leading-none font-bold tracking-[-0.04em]">
        {value}
      </p>
      <p className="text-muted mt-3 text-xs leading-5">{detail}</p>
      <p className="sr-only">Definition: {definition}</p>
    </article>
  );
}

function NoChart({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-lavender-50 text-muted mt-6 flex min-h-44 items-center justify-center rounded-xl px-8 text-center text-sm leading-6">
      {children}
    </div>
  );
}

function ChartHeading({
  description,
  id,
  title,
}: {
  description: string;
  id: string;
  title: string;
}) {
  return (
    <div>
      <h2 id={id} className="text-ink text-lg font-bold">
        {title}
      </h2>
      <p className="text-muted mt-1 text-sm">{description}</p>
    </div>
  );
}

function ComparisonBars({
  buckets,
  first,
  firstLabel,
  second,
  secondLabel,
}: {
  buckets: InsightBucket[];
  first: "worked" | "received";
  firstLabel: string;
  second: "resolved";
  secondLabel: string;
}) {
  const max = Math.max(
    0,
    ...buckets.flatMap((bucket) => [bucket[first], bucket[second]]),
  );
  if (!max) {
    return (
      <NoChart>
        There is not enough activity for this chart in the selected period.
      </NoChart>
    );
  }

  return (
    <>
      <div className="mt-6 flex items-center justify-end gap-5 text-xs">
        <span className="text-muted flex items-center gap-2">
          <span className="bg-lavender-300 h-3 w-3 rounded-sm" /> {firstLabel}
        </span>
        <span className="text-muted flex items-center gap-2">
          <span className="bg-blush-200 h-3 w-3 rounded-sm" /> {secondLabel}
        </span>
      </div>
      <div className="border-border mt-5 overflow-x-auto border-b pb-1">
        <div
          className="flex w-full items-end gap-5"
          style={{ minWidth: `${Math.max(560, buckets.length * 84)}px` }}
        >
          {buckets.map((bucket) => (
            <div
              key={bucket.start}
              className="flex min-w-16 flex-1 flex-col items-center"
            >
              <div className="flex h-40 items-end gap-1.5" aria-hidden="true">
                <div
                  className="bg-lavender-300 w-5 rounded-t-sm"
                  style={{
                    height: `${Math.max(bucket[first] ? 5 : 0, (bucket[first] / max) * 100)}%`,
                  }}
                />
                <div
                  className="bg-blush-200 w-5 rounded-t-sm"
                  style={{
                    height: `${Math.max(bucket[second] ? 5 : 0, (bucket[second] / max) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-quiet mt-3 text-center text-[11px]">
                {bucket.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>{`${firstLabel} compared with ${secondLabel}`}</caption>
        <thead>
          <tr>
            <th>Period</th>
            <th>{firstLabel}</th>
            <th>{secondLabel}</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.start}>
              <th>{bucket.label}</th>
              <td>{bucket[first]}</td>
              <td>{bucket[second]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function StackedActivityBars({ buckets }: { buckets: InsightBucket[] }) {
  const max = Math.max(
    0,
    ...buckets.map((bucket) => bucket.worked + bucket.resolved),
  );
  if (!max) {
    return (
      <NoChart>
        Ticket activity will appear here after work is recorded for this period.
      </NoChart>
    );
  }

  return (
    <>
      <div className="mt-6 flex items-center justify-end gap-5 text-xs">
        <span className="text-muted flex items-center gap-2">
          <span className="bg-lavender-300 h-3 w-3 rounded-sm" /> Worked
        </span>
        <span className="text-muted flex items-center gap-2">
          <span className="bg-blush-200 h-3 w-3 rounded-sm" /> Resolved
        </span>
      </div>
      <div className="border-border relative mt-5 h-52 overflow-x-auto border-b">
        <div
          className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-7"
          aria-hidden="true"
        >
          <span className="border-border border-t" />
          <span className="border-border border-t" />
          <span className="border-border border-t" />
          <span className="border-border border-t" />
        </div>
        <div
          className="relative flex h-full w-full items-end gap-7 px-3"
          style={{ minWidth: `${Math.max(540, buckets.length * 92)}px` }}
        >
          {buckets.map((bucket) => {
            const total = bucket.worked + bucket.resolved;
            return (
              <div
                key={bucket.start}
                className="flex h-full min-w-16 flex-1 flex-col items-center justify-end"
              >
                <div
                  className="flex w-11 flex-col justify-end overflow-hidden rounded-t-sm"
                  style={{
                    height: `${Math.max(total ? 5 : 0, (total / max) * 78)}%`,
                  }}
                  aria-hidden="true"
                >
                  <div
                    className="bg-lavender-300"
                    style={{
                      height: `${total ? (bucket.worked / total) * 100 : 0}%`,
                    }}
                  />
                  <div
                    className="bg-blush-200"
                    style={{
                      height: `${total ? (bucket.resolved / total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-quiet mt-3 pb-2 text-center text-[11px]">
                  {bucket.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <table className="sr-only">
        <caption>Worked and resolved ticket activity</caption>
        <thead>
          <tr>
            <th>Period</th>
            <th>Worked</th>
            <th>Resolved</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.start}>
              <th>{bucket.label}</th>
              <td>{bucket.worked}</td>
              <td>{bucket.resolved}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function ActiveTrend({ buckets }: { buckets: InsightBucket[] }) {
  const max = Math.max(0, ...buckets.map((bucket) => bucket.active));
  if (!max)
    return <NoChart>No active inventory was recorded in this period.</NoChart>;
  const points = buckets.map((bucket, index) => {
    const x =
      buckets.length === 1 ? 300 : 20 + (index / (buckets.length - 1)) * 560;
    const y = 150 - (bucket.active / max) * 120;
    return `${x},${y}`;
  });
  return (
    <>
      <svg
        role="img"
        aria-label="Active ticket inventory trend"
        viewBox="0 0 600 180"
        className="mt-6 h-52 w-full"
      >
        <line x1="20" y1="150" x2="580" y2="150" className="stroke-border" />
        <line x1="20" y1="90" x2="580" y2="90" className="stroke-border" />
        <polyline
          points={points.join(" ")}
          fill="none"
          className="stroke-lavender-500"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        {points.map((point, index) => {
          const [cx, cy] = point.split(",");
          return (
            <circle
              key={buckets[index].start}
              cx={cx}
              cy={cy}
              r="5"
              className="fill-paper stroke-lavender-500"
              strokeWidth="3"
            />
          );
        })}
      </svg>
      <div className="text-quiet flex justify-between text-[11px]">
        <span>{buckets[0]?.label}</span>
        <span>{buckets.at(-1)?.label}</span>
      </div>
      <table className="sr-only">
        <caption>Active ticket inventory by period</caption>
        <thead>
          <tr>
            <th>Period</th>
            <th>Active tickets</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.start}>
              <th>{bucket.label}</th>
              <td>{bucket.active}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function WorkStatusDonut({ status }: { status: InsightsView["workStatus"] }) {
  if (!status.total) {
    return (
      <NoChart>
        Work status will appear when active tickets exist for this date.
      </NoChart>
    );
  }

  const activeEnd = (status.active / status.total) * 100;
  const watchingEnd = activeEnd + (status.watching / status.total) * 100;
  const background = `conic-gradient(
    var(--nh-lavender-300) 0% ${activeEnd}%,
    var(--nh-blush-200) ${activeEnd}% ${watchingEnd}%,
    var(--nh-waiting-surface) ${watchingEnd}% 100%
  )`;

  return (
    <div className="mt-6 grid grid-cols-[230px_1fr] items-center gap-7">
      <div
        role="img"
        aria-label={`Work status: ${status.total} active tickets total; ${status.active} active, ${status.watching} watching, ${status.waiting} waiting.`}
        className="relative h-[230px] w-[230px] rounded-full"
        style={{ background }}
      >
        <div className="bg-paper absolute inset-[38px] flex flex-col items-center justify-center rounded-full">
          <strong className="text-ink text-[36px] leading-none tracking-[-0.05em]">
            {status.total}
          </strong>
          <span className="text-muted mt-2 text-xs">active tickets</span>
        </div>
      </div>
      <dl className="space-y-5">
        {[
          { color: "bg-lavender-300", label: "Active", value: status.active },
          { color: "bg-blush-200", label: "Watching", value: status.watching },
          {
            color: "bg-waiting-surface",
            label: "Waiting",
            value: status.waiting,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="grid grid-cols-[14px_1fr_auto] items-center gap-3"
          >
            <span className={`${item.color} h-3.5 w-3.5 rounded-sm`} />
            <dt className="text-muted text-sm">{item.label}</dt>
            <dd className="text-ink text-sm font-bold">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AgeDistribution({
  values,
}: {
  values: { label: string; value: number }[];
}) {
  const max = Math.max(0, ...values.map((value) => value.value));
  if (!max)
    return <NoChart>There are no active tickets to distribute by age.</NoChart>;
  return (
    <div className="mt-7 space-y-5">
      {values.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[70px_1fr_32px] items-center gap-3"
        >
          <span className="text-muted text-xs">{item.label}</span>
          <div className="bg-lavender-50 h-3 rounded-full">
            <div
              className="bg-lavender-300 h-3 rounded-full"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="text-ink text-right text-sm font-bold">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PlanTrend({ buckets }: { buckets: InsightBucket[] }) {
  const planned = buckets.reduce((sum, bucket) => sum + bucket.planned, 0);
  if (!planned)
    return <NoChart>No planned items were recorded in this period.</NoChart>;
  return (
    <div className="mt-7 space-y-5">
      {buckets.map((bucket) => {
        const rate = bucket.planned
          ? Math.round((bucket.completed / bucket.planned) * 100)
          : 0;
        return (
          <div
            key={bucket.start}
            className="grid grid-cols-[105px_1fr_42px] items-center gap-3"
          >
            <span className="text-muted truncate text-xs">{bucket.label}</span>
            <div className="bg-blush-50 h-3 rounded-full">
              <div
                className="bg-blush-200 h-3 rounded-full"
                style={{ width: `${rate}%` }}
              />
            </div>
            <span className="text-ink text-right text-xs font-bold">
              {rate}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function InsightsPeriodControls({
  insights,
}: {
  insights: InsightsView;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [custom, setCustom] = useState({
    end: insights.end,
    start: insights.start,
  });
  const [customError, setCustomError] = useState<string | null>(null);

  function navigate(url: string) {
    startTransition(() => router.push(url));
  }

  function openReportBuilder() {
    const period =
      insights.period === "week"
        ? "weekly"
        : insights.period === "month"
          ? "monthly"
          : "monthly";
    window.sessionStorage.setItem(
      "north-haven:report-entry",
      JSON.stringify({ anchor: insights.end, period }),
    );
    navigate("/insights/reports");
  }

  return (
    <div className="flex items-end gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={openReportBuilder}
        className="bg-lavender-300 text-lavender-700 hover:bg-lavender-200 rounded-lg px-5 py-3 text-sm font-bold disabled:opacity-50"
      >
        Export report
      </button>
      <label className="text-muted text-xs font-bold">
        Period
        <select
          aria-label="Insights period"
          disabled={pending}
          value={insights.period}
          onChange={(event) => {
            const next = event.target.value;
            if (next === "custom") {
              navigate(
                insightsUrl({
                  period: "custom",
                  start: insights.start,
                  end: insights.end,
                }),
              );
            } else {
              navigate(insightsUrl({ period: next, anchor: insights.end }));
            }
          }}
          className="border-border bg-paper text-ink mt-1 block rounded-lg border px-4 py-3 text-sm font-medium"
        >
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="quarter">Quarter</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      {insights.period === "custom" ? (
        <form
          className="relative flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const dayCount = Math.round(
              (new Date(`${custom.end}T12:00:00Z`).valueOf() -
                new Date(`${custom.start}T12:00:00Z`).valueOf()) /
                86_400_000,
            );
            if (dayCount < 0 || dayCount > 370) {
              setCustomError("Choose a range of 371 days or fewer.");
              return;
            }
            setCustomError(null);
            navigate(
              insightsUrl({
                period: "custom",
                start: custom.start,
                end: custom.end,
              }),
            );
          }}
        >
          <label className="text-muted text-xs font-bold">
            From
            <input
              aria-label="Custom start date"
              type="date"
              value={custom.start}
              max={custom.end < insights.today ? custom.end : insights.today}
              onChange={(event) =>
                setCustom((value) => ({ ...value, start: event.target.value }))
              }
              className="border-border bg-paper text-ink mt-1 block rounded-lg border px-3 py-2.5 text-sm"
            />
          </label>
          <label className="text-muted text-xs font-bold">
            To
            <input
              aria-label="Custom end date"
              type="date"
              value={custom.end}
              min={custom.start}
              max={insights.today}
              onChange={(event) =>
                setCustom((value) => ({ ...value, end: event.target.value }))
              }
              className="border-border bg-paper text-ink mt-1 block rounded-lg border px-3 py-2.5 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={pending || !custom.start || !custom.end}
            className="border-lavender-300 bg-paper text-lavender-700 rounded-lg border px-4 py-3 text-sm font-bold disabled:opacity-50"
          >
            Apply
          </button>
          {customError ? (
            <p
              role="alert"
              className="text-blush-600 absolute -bottom-5 left-0 text-[11px]"
            >
              {customError}
            </p>
          ) : null}
        </form>
      ) : (
        <label className="text-muted text-xs font-bold">
          Date
          <input
            aria-label="Date inside selected period"
            type="date"
            value={insights.end}
            max={insights.today}
            disabled={pending}
            onChange={(event) =>
              navigate(
                insightsUrl({
                  period: insights.period,
                  anchor: event.target.value,
                }),
              )
            }
            className="border-border bg-paper text-ink mt-1 block rounded-lg border px-3 py-2.5 text-sm"
          />
        </label>
      )}
    </div>
  );
}

export function InsightsDashboard({ insights }: { insights: InsightsView }) {
  const buckets = useMemo(
    () => buildInsightBuckets(insights.daily, insights.inventory),
    [insights.daily, insights.inventory],
  );
  const summary = getInsightSummary(insights);
  const inventory = summary.inventoryEnd;
  const activityTop = buckets.reduce<InsightBucket | null>(
    (top, bucket) => (!top || bucket.worked > top.worked ? bucket : top),
    null,
  );
  const activeStart = insights.inventory[0]?.activeTickets ?? 0;
  const activeEnd = inventory?.activeTickets ?? 0;
  const planText =
    summary.planCompletion === null
      ? "No eligible plan items were recorded."
      : `${summary.planCompletion}% of planned items were completed.`;

  return (
    <div className="mx-auto max-w-[1440px] p-8">
      <section className="border-border bg-paper shadow-surface rounded-xl border p-7">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-quiet text-[11px] font-bold tracking-[0.12em] uppercase">
              Period at a glance
            </p>
            <h2 className="text-ink mt-2 text-xl font-bold">
              {periodLabel(insights.start, insights.end)}
            </h2>
            {insights.isPartial ? (
              <p className="text-muted mt-1 text-xs">
                Current period through today
              </p>
            ) : null}
          </div>
          <p className="text-quiet text-xs">Dates use {insights.timeZone}</p>
        </div>

        <div className="mt-7 grid grid-cols-5 gap-4">
          <Metric
            label="Tickets worked"
            value={insights.totals.ticketsWorked}
            definition="Distinct tickets with at least one work log in the selected period."
            detail={changeText(
              insights.totals.ticketsWorked,
              insights.previousTotals.ticketsWorked,
            )}
          />
          <Metric
            tone="blush"
            label="Resolved"
            value={insights.totals.ticketsResolved}
            definition="Times tickets entered Resolved during the selected period. Reopening does not erase the event."
            detail={changeText(
              insights.totals.ticketsResolved,
              insights.previousTotals.ticketsResolved,
            )}
          />
          <Metric
            label="Closed"
            value={insights.totals.ticketsClosed}
            definition="Times downstream changes were confirmed and tickets entered Closed during the selected period."
            detail={changeText(
              insights.totals.ticketsClosed,
              insights.previousTotals.ticketsClosed,
            )}
          />
          <Metric
            tone="blush"
            label="Active tickets"
            value={activeEnd}
            definition="Tickets not Closed or Archived as of the end of this period. Waiting and Watching are included."
            detail={`Snapshot on ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${insights.end}T12:00:00Z`))}`}
          />
          <Metric
            label="Plan completion"
            value={
              summary.planCompletion === null
                ? "—"
                : `${summary.planCompletion}%`
            }
            definition="Completed actionable plan items divided by eligible planned items."
            detail={planText}
          />
        </div>

        <dl className="border-border mt-6 grid grid-cols-4 divide-x border-t border-b py-5">
          <div className="px-5 first:pl-0">
            <dt className="text-muted text-xs">Waiting for Response</dt>
            <dd className="text-ink mt-1 text-lg font-bold">
              {inventory?.waitingTickets ?? 0}
            </dd>
            <p className="sr-only">
              Active tickets whose latest operational status is Waiting for
              Response.
            </p>
          </div>
          <div className="px-5">
            <dt className="text-muted text-xs">Watching</dt>
            <dd className="text-ink mt-1 text-lg font-bold">
              {inventory?.watchingTickets ?? 0}
            </dd>
            <p className="sr-only">
              Active tickets kept visible while downstream work is pending.
            </p>
          </div>
          <div className="px-5">
            <dt className="text-muted text-xs">Average daily worked</dt>
            <dd className="text-ink mt-1 text-lg font-bold">
              {summary.averageDailyWorked.toFixed(1)}
            </dd>
            <p className="sr-only">
              Average ticket work entries per configured working day, excluding
              full-day Out of Office dates.
            </p>
          </div>
          <div className="px-5">
            <dt className="text-muted text-xs">Average active age</dt>
            <dd className="text-ink mt-1 text-lg font-bold">
              {(inventory?.averageActiveAge ?? 0).toFixed(1)} days
            </dd>
            <p className="sr-only">
              Average number of days since received for tickets active at the
              end of this period.
            </p>
          </div>
        </dl>

        <p className="text-muted mt-5 text-sm">
          Also completed: {plural(insights.totals.tasksCompleted, "task")},{" "}
          {plural(insights.totals.remindersCompleted, "reminder")}, and{" "}
          {plural(insights.totals.meetingsAttended, "meeting")} attended.
        </p>
      </section>

      <section className="border-border bg-paper shadow-surface mt-6 rounded-xl border p-7">
        <div className="divide-border grid grid-cols-[minmax(0,1.18fr)_minmax(430px,0.82fr)] divide-x">
          <div className="pr-8">
            <ChartHeading
              id="weekly-rhythm-title"
              title="Weekly rhythm"
              description="Tickets worked and resolved across the selected period"
            />
            <StackedActivityBars buckets={buckets} />
          </div>
          <div className="pl-8">
            <ChartHeading
              id="work-status-title"
              title="Work status"
              description="Active inventory at the end of this period"
            />
            <WorkStatusDonut status={insights.workStatus} />
            <p className="bg-lavender-50 text-muted mt-6 rounded-lg p-4 text-sm leading-6">
              <strong className="text-ink block">A steady pattern</strong>
              <span className="mt-1 block">
                {activityTop && activityTop.worked
                  ? `${activityTop.label} had the most worked activity; `
                  : "No ticket work was recorded; "}
                {insights.workStatus.waiting === 1
                  ? "1 ticket is waiting for a response."
                  : `${insights.workStatus.waiting} tickets are waiting for a response.`}
              </span>
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <section
          aria-labelledby="flow-title"
          className="border-border bg-paper shadow-surface rounded-xl border p-7"
        >
          <ChartHeading
            id="flow-title"
            title="Received versus resolved"
            description="New ticket demand compared with resolution events"
          />
          <ComparisonBars
            buckets={buckets}
            first="received"
            firstLabel="Received"
            second="resolved"
            secondLabel="Resolved"
          />
          <p className="bg-blush-50 text-muted mt-6 rounded-lg p-4 text-sm leading-6">
            {plural(summary.totalReceived, "ticket")} received and{" "}
            {plural(insights.totals.ticketsResolved, "resolution")} recorded in
            this period.
          </p>
        </section>

        <section
          aria-labelledby="inventory-title"
          className="border-border bg-paper shadow-surface rounded-xl border p-7"
        >
          <ChartHeading
            id="inventory-title"
            title="Active inventory trend"
            description="Open workload at the end of each interval"
          />
          <ActiveTrend buckets={buckets} />
          <p className="bg-lavender-50 text-muted mt-6 rounded-lg p-4 text-sm leading-6">
            Active inventory{" "}
            {activeEnd === activeStart
              ? "remained stable"
              : activeEnd > activeStart
                ? `increased by ${activeEnd - activeStart}`
                : `decreased by ${activeStart - activeEnd}`}{" "}
            across this period.
          </p>
        </section>

        <section
          aria-labelledby="age-title"
          className="border-border bg-paper shadow-surface rounded-xl border p-7"
        >
          <ChartHeading
            id="age-title"
            title="Ticket age distribution"
            description={`Active inventory as of ${insights.end}`}
          />
          <AgeDistribution
            values={[
              { label: "0–7 days", value: inventory?.age0To7 ?? 0 },
              { label: "8–14 days", value: inventory?.age8To14 ?? 0 },
              { label: "15–30 days", value: inventory?.age15To30 ?? 0 },
              { label: "31+ days", value: inventory?.age31Plus ?? 0 },
            ]}
          />
          <p className="bg-lavender-50 text-muted mt-7 rounded-lg p-4 text-sm leading-6">
            Average active ticket age was{" "}
            {(inventory?.averageActiveAge ?? 0).toFixed(1)} days at period end.
          </p>
        </section>

        <section
          aria-labelledby="plan-title"
          className="border-border bg-paper shadow-surface rounded-xl border p-7"
        >
          <ChartHeading
            id="plan-title"
            title="Plan completion rhythm"
            description="Completed plan items compared with eligible planned items"
          />
          <PlanTrend buckets={buckets} />
          <p className="bg-blush-50 text-muted mt-7 rounded-lg p-4 text-sm leading-6">
            {planText}
          </p>
        </section>
      </div>
    </div>
  );
}

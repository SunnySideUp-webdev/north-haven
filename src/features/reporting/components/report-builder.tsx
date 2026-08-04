"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { loadReportPreviewAction } from "@/features/reporting/actions";
import { periodLabel } from "@/features/reporting/insights";
import {
  planCompletion,
  reportTitle,
  type ReportConfig,
  type ReportPeriod,
  type ReportView,
} from "@/features/reporting/reports";
import { formatTicketNumber } from "@/shared/ticket-number";

const entryStorageKey = "north-haven:report-entry";

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function weekday(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
  }).format(new Date(`${value}T12:00:00Z`));
}

function Metric({
  blush = false,
  label,
  value,
}: {
  blush?: boolean;
  label: string;
  value: string | number;
}) {
  return (
    <div
      className={`${blush ? "bg-blush-100" : "bg-lavender-50"} rounded-lg p-4`}
    >
      <dt className="text-muted text-[10px] font-bold tracking-[0.08em] uppercase">
        {label}
      </dt>
      <dd className="text-ink mt-2 text-2xl font-bold tracking-[-0.04em]">
        {value}
      </dd>
    </div>
  );
}

function EmptyDetail({ children }: { children: React.ReactNode }) {
  return (
    <p className="bg-lavender-50 text-muted mt-3 rounded-lg px-4 py-3 text-xs leading-5">
      {children}
    </p>
  );
}

function TrendPreview({ report }: { report: ReportView }) {
  if (report.config.period === "daily") {
    return (
      <dl className="mt-5 divide-y">
        {[
          ["Resolved", report.totals.ticketsResolved],
          ["Closed", report.totals.ticketsClosed],
          ["Meetings attended", report.totals.meetingsAttended],
          [
            "Tasks and reminders",
            report.totals.tasksCompleted + report.totals.remindersCompleted,
          ],
          ["Follow-up decisions", report.followUpDecisions],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between py-3 text-xs">
            <dt className="text-muted">{label}</dt>
            <dd className="text-ink font-bold">{value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if (report.config.period === "monthly") {
    const max = Math.max(
      1,
      ...report.inventory.map((row) => row.activeTickets),
    );
    const points = report.inventory.map((row, index) => {
      const x =
        report.inventory.length === 1
          ? 300
          : 20 + (index / (report.inventory.length - 1)) * 560;
      return `${x},${145 - (row.activeTickets / max) * 115}`;
    });
    return (
      <>
        <svg
          role="img"
          aria-label={`Active inventory moved from ${report.inventory[0]?.activeTickets ?? 0} to ${report.inventory.at(-1)?.activeTickets ?? 0} tickets.`}
          viewBox="0 0 600 170"
          className="mt-5 h-42 w-full"
        >
          <line x1="20" y1="145" x2="580" y2="145" className="stroke-border" />
          <line x1="20" y1="85" x2="580" y2="85" className="stroke-border" />
          <polyline
            points={points.join(" ")}
            fill="none"
            className="stroke-lavender-300"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="6"
          />
          {points.map((point, index) => {
            const [cx, cy] = point.split(",");
            return (
              <circle
                key={report.inventory[index].workDate}
                cx={cx}
                cy={cy}
                r="5"
                className="fill-blush-200"
              />
            );
          })}
        </svg>
        <p className="text-muted mt-2 text-xs">
          Active inventory moved from {report.inventory[0]?.activeTickets ?? 0}{" "}
          to {report.inventory.at(-1)?.activeTickets ?? 0} tickets.
        </p>
      </>
    );
  }

  const inventoryByDate = new Map(
    report.inventory.map((row) => [row.workDate, row]),
  );
  const max = Math.max(
    1,
    ...report.daily.flatMap((day) => [
      inventoryByDate.get(day.workDate)?.ticketsReceived ?? 0,
      day.ticketsResolved,
    ]),
  );
  return (
    <>
      <div className="text-muted mt-3 flex justify-end gap-4 text-[10px]">
        <span className="flex items-center gap-1.5">
          <span className="bg-lavender-300 h-2.5 w-2.5" /> Received
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-blush-200 h-2.5 w-2.5" /> Resolved
        </span>
      </div>
      <div className="mt-4 flex items-end gap-5 px-3">
        {report.daily.map((day) => {
          const received =
            inventoryByDate.get(day.workDate)?.ticketsReceived ?? 0;
          return (
            <div
              key={day.workDate}
              className="flex min-w-8 flex-1 flex-col items-center"
            >
              <div className="border-border flex h-40 w-full items-end justify-center gap-1.5 border-b">
                <span
                  className="bg-lavender-300 w-5 rounded-t-sm"
                  style={{
                    height: `${Math.max(received ? 8 : 1, (received / max) * 75)}%`,
                  }}
                  aria-hidden="true"
                />
                <span
                  className="bg-blush-200 w-5 rounded-t-sm"
                  style={{
                    height: `${Math.max(day.ticketsResolved ? 8 : 1, (day.ticketsResolved / max) * 75)}%`,
                  }}
                  aria-hidden="true"
                />
              </div>
              <span className="text-quiet mt-2 text-[10px] font-bold">
                {weekday(day.workDate)}
              </span>
              <dl
                className="mt-1.5 grid gap-1 text-[10px]"
                aria-label={`${weekday(day.workDate)} activity totals`}
              >
                <div className="flex justify-center">
                  <dt className="sr-only">Received</dt>
                  <dd className="text-muted flex min-w-7 items-center gap-1">
                    <span
                      className="bg-lavender-300 h-2 w-2"
                      aria-hidden="true"
                    />
                    {received}
                  </dd>
                </div>
                <div className="flex justify-center">
                  <dt className="sr-only">Resolved</dt>
                  <dd className="text-muted flex min-w-7 items-center gap-1">
                    <span className="bg-blush-200 h-2 w-2" aria-hidden="true" />
                    {day.ticketsResolved}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
      <table className="sr-only">
        <caption>Ticket flow by day</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Received</th>
            <th>Resolved</th>
          </tr>
        </thead>
        <tbody>
          {report.daily.map((day) => (
            <tr key={day.workDate}>
              <th>{day.workDate}</th>
              <td>{inventoryByDate.get(day.workDate)?.ticketsReceived ?? 0}</td>
              <td>{day.ticketsResolved}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function PdfPreview({ report }: { report: ReportView }) {
  const completion = planCompletion(report.totals);
  const statusTitle =
    report.config.period === "daily"
      ? "End-of-day status"
      : report.config.period === "weekly"
        ? "End-of-week status"
        : "End-of-month status";
  const detailsIncluded =
    report.config.includeTicketDetails ||
    report.config.includeDayNotes ||
    report.config.includeFollowUpReasons;

  if (!report.hasData) {
    return (
      <div className="bg-lavender-50 text-muted flex min-h-[520px] items-center justify-center rounded-lg px-12 text-center text-sm">
        There is not enough activity for this period. Choose a different date.
      </div>
    );
  }

  return (
    <article
      aria-labelledby="report-preview-title"
      className="border-border bg-paper border-t-blush-200 relative min-h-[720px] border-t-4 px-8 py-7 shadow-[0_8px_28px_rgb(117_110_121/10%)]"
    >
      <div className="border-border flex items-center justify-between border-b pb-4">
        <p className="text-ink text-lg font-bold">North Haven</p>
        <p className="text-muted text-[10px] font-bold tracking-[0.12em] uppercase">
          Private work summary
        </p>
      </div>
      <div className="mt-7 flex items-end justify-between gap-5">
        <div>
          <h2
            id="report-preview-title"
            className="text-ink text-[28px] leading-none font-bold tracking-[-0.04em]"
          >
            {reportTitle(report.config.period)}
          </h2>
          <p className="text-muted mt-2 text-sm">
            {periodLabel(report.start, report.end)}
            {report.isPartial ? ` · Through ${shortDate(report.end)}` : ""}
          </p>
        </div>
        <p className="text-quiet text-right text-[10px]">{report.timeZone}</p>
      </div>

      {report.config.includeSummaryMetrics ? (
        <dl className="mt-7 grid grid-cols-4 gap-3">
          <Metric label="Tickets worked" value={report.totals.ticketsWorked} />
          <Metric
            blush
            label="Resolved"
            value={report.totals.ticketsResolved}
          />
          <Metric label="Closed" value={report.totals.ticketsClosed} />
          <Metric
            blush
            label="Plan completion"
            value={completion === null ? "—" : `${completion}%`}
          />
        </dl>
      ) : null}

      {report.config.includeTrend || report.config.includeStatus ? (
        <div className="divide-border mt-8 grid grid-cols-[minmax(0,1.35fr)_minmax(230px,0.65fr)] divide-x">
          {report.config.includeTrend ? (
            <section className="pr-7">
              <h3 className="text-ink text-sm font-bold">
                {report.config.period === "daily"
                  ? "Day outcome"
                  : report.config.period === "monthly"
                    ? "Active inventory trend"
                    : "Ticket flow by day"}
              </h3>
              <p className="text-muted mt-1 text-xs">
                {report.config.period === "monthly"
                  ? "Active tickets across the report period"
                  : report.config.period === "daily"
                    ? "Tickets with confirmed work activity"
                    : "New ticket demand compared with resolution events"}
              </p>
              <TrendPreview report={report} />
            </section>
          ) : (
            <div />
          )}
          {report.config.includeStatus ? (
            <section className="pl-7">
              <h3 className="text-ink text-sm font-bold">{statusTitle}</h3>
              <p className="text-muted mt-1 text-xs">
                Snapshot on {shortDate(report.end)}
              </p>
              <dl className="mt-4 divide-y">
                {[
                  ...(report.config.period === "monthly"
                    ? [
                        [
                          "Tickets received",
                          report.inventory.reduce(
                            (sum, row) => sum + row.ticketsReceived,
                            0,
                          ),
                        ],
                      ]
                    : []),
                  ["Active tickets", report.workStatus.total],
                  ["Watching", report.workStatus.watching],
                  ["Waiting for Response", report.workStatus.waiting],
                  ["Reviews due next week", report.followUpDueCount],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between py-3 text-xs"
                  >
                    <dt className="text-muted">{label}</dt>
                    <dd className="text-ink font-bold">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>
      ) : null}

      {report.config.includeNarrative ? (
        <section className="bg-lavender-50 mt-7 rounded-lg p-5">
          <h3 className="text-ink text-sm font-bold">
            {report.config.period === "daily"
              ? "Day in brief"
              : report.config.period === "weekly"
                ? "Week in brief"
                : "Month in brief"}
          </h3>
          {report.narrative.map((line) => (
            <p key={line} className="text-muted mt-2 text-xs leading-5">
              {line}
            </p>
          ))}
          <p className="text-muted mt-2 text-xs leading-5">
            Customer details and ticket titles are{" "}
            {detailsIncluded
              ? "included where selected"
              : "excluded from this report"}
            .
          </p>
        </section>
      ) : null}

      {report.config.includeTicketDetails ? (
        <section className="mt-7">
          <h3 className="text-ink text-sm font-bold">Tickets worked</h3>
          {report.ticketDetails.length ? (
            <ul className="mt-3 divide-y">
              {report.ticketDetails.map((ticket) => (
                <li key={ticket.ticketNumber} className="py-3 text-xs">
                  <strong>{formatTicketNumber(ticket.ticketNumber)}</strong> ·{" "}
                  {ticket.title}
                  <span className="text-muted mt-1 block">
                    Worked {ticket.workDates.map(shortDate).join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyDetail>
              No ticket numbers or titles matched this report period.
            </EmptyDetail>
          )}
        </section>
      ) : null}

      {report.config.includeDayNotes ? (
        <section className="mt-7">
          <h3 className="text-ink text-sm font-bold">Day notes</h3>
          {report.dayNotes.length ? (
            report.dayNotes.map((note) => (
              <div
                key={note.workDate}
                className="bg-blush-50 mt-3 rounded-lg p-4 text-xs leading-5"
              >
                <strong>
                  {shortDate(note.workDate)}
                  {note.isImportant ? " · Important" : ""}
                </strong>
                <p className="text-muted mt-1">{note.body}</p>
              </div>
            ))
          ) : (
            <EmptyDetail>
              No day notes were recorded for this period.
            </EmptyDetail>
          )}
        </section>
      ) : null}

      {report.config.includeFollowUpReasons ? (
        <section className="mt-7">
          <h3 className="text-ink text-sm font-bold">Upcoming follow-ups</h3>
          {report.followUps.length ? (
            <ul className="mt-3 divide-y">
              {report.followUps.map((followUp, index) => (
                <li
                  key={`${followUp.reviewOn}-${index}`}
                  className="py-3 text-xs"
                >
                  <strong>
                    {followUp.ticketNumber
                      ? `${formatTicketNumber(followUp.ticketNumber)} · `
                      : ""}
                    {followUp.title}
                  </strong>
                  <span className="text-muted mt-1 block">
                    Review {shortDate(followUp.reviewOn)} · {followUp.reason}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyDetail>
              No follow-up reviews are due in the next workweek.
            </EmptyDetail>
          )}
        </section>
      ) : null}

      <footer className="border-border text-quiet mt-8 flex justify-between border-t pt-4 text-[10px]">
        <span>Generated on demand · {report.timeZone}</span>
        <span>North Haven · preview</span>
      </footer>
    </article>
  );
}

function CsvPreview({ report }: { report: ReportView }) {
  return (
    <div className="border-border bg-paper min-h-[520px] rounded-lg border p-6">
      <p className="text-quiet text-[10px] font-bold tracking-[0.12em] uppercase">
        Data CSV preview
      </p>
      <h2 className="text-ink mt-3 text-xl font-bold">One row per date</h2>
      <p className="text-muted mt-2 text-sm">
        UTF-8 data with stable English column names and one period-total row.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead className="bg-lavender-50 text-muted">
            <tr>
              <th className="px-3 py-3">date</th>
              <th className="px-3 py-3">tickets_worked</th>
              <th className="px-3 py-3">resolved</th>
              <th className="px-3 py-3">closed</th>
              <th className="px-3 py-3">planned</th>
              <th className="px-3 py-3">completed</th>
              <th className="px-3 py-3">active</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {report.daily.slice(0, 6).map((day) => (
              <tr key={day.workDate}>
                <th className="px-3 py-3 font-medium">{day.workDate}</th>
                <td className="px-3 py-3">{day.ticketsWorked}</td>
                <td className="px-3 py-3">{day.ticketsResolved}</td>
                <td className="px-3 py-3">{day.ticketsClosed}</td>
                <td className="px-3 py-3">{day.plannedItems}</td>
                <td className="px-3 py-3">{day.completedItems}</td>
                <td className="px-3 py-3">
                  {report.inventory.find((row) => row.workDate === day.workDate)
                    ?.activeTickets ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {report.daily.length > 6 ? (
        <p className="text-quiet mt-4 text-xs">
          Previewing 6 of {report.daily.length} date rows.
        </p>
      ) : null}
    </div>
  );
}

function CheckOption({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description?: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="text-ink flex cursor-pointer items-start gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-lavender-700 mt-0.5 h-4 w-4"
      />
      <span>
        <span className="font-medium">{label}</span>
        {description ? (
          <span className="text-quiet mt-1 block text-[11px] leading-4">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function ReportPreview({ report }: { report: ReportView }) {
  return report.config.format === "pdf" ? (
    <PdfPreview report={report} />
  ) : (
    <CsvPreview report={report} />
  );
}

export function ReportBuilder({
  initialReport,
}: {
  initialReport: ReportView;
}) {
  const [config, setConfig] = useState(initialReport.config);
  const [report, setReport] = useState(initialReport);
  const [message, setMessage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [pending, startTransition] = useTransition();
  const requestId = useRef(0);
  const displayReport = { ...report, config };
  const containsDetails =
    config.includeTicketDetails ||
    config.includeDayNotes ||
    config.includeFollowUpReasons;

  function refresh(next: ReportConfig) {
    setConfig(next);
    setMessage(null);
    const id = ++requestId.current;
    startTransition(async () => {
      const result = await loadReportPreviewAction(next);
      if (id !== requestId.current) return;
      if (result.ok && result.report) {
        setReport(result.report);
      } else {
        setMessage(result.message ?? "We couldn't prepare this preview.");
      }
    });
  }

  useEffect(() => {
    const stored = window.sessionStorage.getItem(entryStorageKey);
    window.sessionStorage.removeItem(entryStorageKey);
    if (!stored) return;
    try {
      const entry = JSON.parse(stored) as { anchor?: string; period?: string };
      if (
        /^\d{4}-\d{2}-\d{2}$/.test(entry.anchor ?? "") &&
        ["daily", "weekly", "monthly"].includes(entry.period ?? "")
      ) {
        const timer = window.setTimeout(() => {
          refresh({
            ...initialReport.config,
            anchor: entry.anchor!,
            period: entry.period as ReportPeriod,
          });
        }, 0);
        return () => window.clearTimeout(timer);
      }
    } catch {
      // A malformed local preference should never block the builder.
    }
    // The saved Insights entry is intentionally read only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setSimple<K extends keyof ReportConfig>(
    key: K,
    value: ReportConfig[K],
    needsData = false,
  ) {
    const next = { ...config, [key]: value };
    if (needsData) refresh(next);
    else setConfig(next);
  }

  async function download() {
    setGenerating(true);
    setMessage(null);
    try {
      const response = await fetch("/api/reports/export", {
        body: JSON.stringify(config),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(body?.message ?? "We couldn't create this report.");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename =
        disposition.match(/filename="([^"]+)"/)?.[1] ??
        `north-haven-report.${config.format}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setMessage("Your report is ready.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We couldn't create this report. Your settings are still here.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1440px] p-8">
      <div className="border-border bg-paper shadow-surface grid grid-cols-[350px_minmax(0,1fr)] gap-10 rounded-xl border p-7">
        <aside className="bg-lavender-50 rounded-xl p-6">
          <h2 className="text-ink text-lg font-bold">Report settings</h2>

          <fieldset className="mt-7">
            <legend className="text-quiet text-[10px] font-bold tracking-[0.12em] uppercase">
              Period
            </legend>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["daily", "weekly", "monthly"] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  disabled={pending}
                  onClick={() => refresh({ ...config, period })}
                  className={`${config.period === period ? "bg-lavender-200 text-lavender-700" : "border-border bg-paper text-muted border"} rounded-lg px-2 py-3 text-xs font-bold capitalize disabled:opacity-50`}
                >
                  {period}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="text-quiet mt-7 block text-[10px] font-bold tracking-[0.12em] uppercase">
            Date inside period
            <input
              type="date"
              value={config.anchor}
              max={report.today}
              disabled={pending}
              onChange={(event) =>
                refresh({ ...config, anchor: event.target.value })
              }
              className="border-border bg-paper text-ink mt-3 w-full rounded-lg border px-4 py-3 text-sm font-medium normal-case disabled:opacity-50"
            />
          </label>
          <p className="text-muted mt-2 text-xs leading-5">
            {periodLabel(report.start, report.end)}
            {report.isPartial ? ` · Through ${shortDate(report.end)}` : ""}
          </p>

          <fieldset className="mt-7 space-y-4">
            <legend className="text-quiet mb-4 text-[10px] font-bold tracking-[0.12em] uppercase">
              Include
            </legend>
            <CheckOption
              checked={config.includeSummaryMetrics}
              label="Summary metrics"
              onChange={(value) => setSimple("includeSummaryMetrics", value)}
            />
            <CheckOption
              checked={config.includeTrend}
              label="Trend chart"
              onChange={(value) => setSimple("includeTrend", value)}
            />
            <CheckOption
              checked={config.includeStatus}
              label="Current work status"
              onChange={(value) => setSimple("includeStatus", value)}
            />
            <CheckOption
              checked={config.includeNarrative}
              label="Plain-language summary"
              onChange={(value) => setSimple("includeNarrative", value)}
            />
            <div className="border-border border-t pt-4">
              <CheckOption
                checked={config.includeTicketDetails}
                label="Ticket numbers and titles"
                description="Off by default to protect customer information"
                onChange={(value) =>
                  setSimple("includeTicketDetails", value, value)
                }
              />
            </div>
            <CheckOption
              checked={config.includeDayNotes}
              label="Day notes"
              description="May contain customer information"
              onChange={(value) => setSimple("includeDayNotes", value, value)}
            />
            <CheckOption
              checked={config.includeFollowUpReasons}
              label="Follow-up reasons"
              description="Includes review context"
              onChange={(value) =>
                setSimple("includeFollowUpReasons", value, value)
              }
            />
          </fieldset>

          <fieldset className="mt-7">
            <legend className="text-quiet text-[10px] font-bold tracking-[0.12em] uppercase">
              Format
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["pdf", "csv"] as const).map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => setSimple("format", format)}
                  className={`${config.format === format ? "bg-lavender-200 text-lavender-700" : "border-border bg-paper text-muted border"} rounded-lg px-3 py-3 text-xs font-bold`}
                >
                  {format === "pdf" ? "Designed PDF" : "Data CSV"}
                </button>
              ))}
            </div>
          </fieldset>

          {containsDetails ? (
            <div
              role="note"
              className="bg-blush-100 text-blush-600 mt-6 rounded-lg p-4 text-xs leading-5"
            >
              <strong className="block">
                This report may contain customer information.
              </strong>
              Only share the downloaded file with approved recipients.
            </div>
          ) : null}
          <p className="bg-blush-50 text-blush-600 mt-6 rounded-lg px-4 py-3 text-center text-[11px]">
            Generated on demand · not stored by North Haven
          </p>
          <button
            type="button"
            disabled={pending || generating || !report.hasData}
            onClick={download}
            className="bg-lavender-300 text-lavender-700 hover:bg-lavender-200 mt-4 w-full rounded-lg px-5 py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating
              ? "Preparing your report…"
              : config.format === "pdf"
                ? "Generate PDF"
                : "Download CSV"}
          </button>
          {message ? (
            <p
              role="status"
              className="text-muted mt-3 text-center text-xs leading-5"
            >
              {message}
            </p>
          ) : null}
        </aside>

        <section aria-busy={pending} className="min-w-0">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-ink text-lg font-bold">Preview</h2>
            <p className="text-quiet text-xs">
              {config.format === "pdf"
                ? "PDF · selectable text"
                : "CSV · UTF-8"}
            </p>
          </div>
          <div className={`relative ${pending ? "opacity-55" : ""}`}>
            <ReportPreview report={displayReport} />
            {pending ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-paper border-border text-muted rounded-lg border px-5 py-3 text-sm shadow-sm">
                  Preparing preview…
                </span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

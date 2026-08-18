import type { ReportView } from "@/features/reporting/reports";
import { planCompletion } from "@/features/reporting/reports";

const headers = [
  "record_type",
  "date",
  "tickets_worked",
  "tickets_resolved",
  "tickets_closed",
  "tasks_completed",
  "reminders_completed",
  "meetings_attended",
  "follow_up_decisions",
  "planned_items",
  "completed_items",
  "plan_completion_percent",
  "pending_tickets",
  "in_progress_tickets",
  "waiting_for_response",
  "resolved_status_tickets",
  "ticket_numbers",
  "ticket_titles",
  "task_titles",
  "day_note",
  "follow_up_reasons",
] as const;

function csvCell(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  return /[",\n\r]/.test(stringValue)
    ? `"${stringValue.replaceAll('"', '""')}"`
    : stringValue;
}

export function reportToCsv(report: ReportView) {
  const inventoryByDate = new Map(
    report.inventory.map((row) => [row.workDate, row]),
  );
  const notesByDate = new Map(
    report.dayNotes.map((note) => [note.workDate, note.body]),
  );
  const decisionsByDate = new Map(
    report.followUpDecisionsByDate.map((row) => [row.workDate, row.count]),
  );
  const detailsByDate = new Map<
    string,
    { numbers: string[]; titles: string[] }
  >();
  for (const detail of report.ticketDetails) {
    for (const date of detail.workDates) {
      const values = detailsByDate.get(date) ?? { numbers: [], titles: [] };
      values.numbers.push(detail.ticketNumber);
      values.titles.push(detail.title);
      detailsByDate.set(date, values);
    }
  }
  const taskTitlesByDate = new Map<string, string[]>();
  for (const detail of report.taskDetails) {
    for (const date of detail.workDates) {
      const values = taskTitlesByDate.get(date) ?? [];
      values.push(detail.title);
      taskTitlesByDate.set(date, values);
    }
  }

  const rows = report.daily.map((day) => {
    const inventory = inventoryByDate.get(day.workDate);
    const details = detailsByDate.get(day.workDate);
    const completion = day.plannedItems
      ? Math.round((day.completedItems / day.plannedItems) * 100)
      : null;
    return [
      "date",
      day.workDate,
      report.config.includeSummaryMetrics ? day.ticketsWorked : null,
      report.config.includeSummaryMetrics ? day.ticketsResolved : null,
      report.config.includeSummaryMetrics ? day.ticketsClosed : null,
      report.config.includeSummaryMetrics ? day.tasksCompleted : null,
      report.config.includeSummaryMetrics ? day.remindersCompleted : null,
      report.config.includeSummaryMetrics ? day.meetingsAttended : null,
      report.config.includeSummaryMetrics
        ? (decisionsByDate.get(day.workDate) ?? 0)
        : null,
      report.config.includeSummaryMetrics ? day.plannedItems : null,
      report.config.includeSummaryMetrics ? day.completedItems : null,
      report.config.includeSummaryMetrics ? completion : null,
      null,
      null,
      report.config.includeStatus ? inventory?.waitingTickets : null,
      null,
      report.config.includeTicketDetails ? details?.numbers.join(" | ") : null,
      report.config.includeTicketDetails ? details?.titles.join(" | ") : null,
      report.config.includeTaskDetails
        ? taskTitlesByDate.get(day.workDate)?.join(" | ")
        : null,
      report.config.includeDayNotes ? notesByDate.get(day.workDate) : null,
      null,
    ];
  });

  const followUpReasons = report.config.includeFollowUpReasons
    ? report.followUps
        .map((item) =>
          [item.ticketNumber, item.title, item.reason]
            .filter(Boolean)
            .join(" — "),
        )
        .join(" | ")
    : null;
  rows.push([
    "period_total",
    `${report.start}/${report.end}`,
    report.config.includeSummaryMetrics ? report.totals.ticketsWorked : null,
    report.config.includeSummaryMetrics ? report.totals.ticketsResolved : null,
    report.config.includeSummaryMetrics ? report.totals.ticketsClosed : null,
    report.config.includeSummaryMetrics ? report.totals.tasksCompleted : null,
    report.config.includeSummaryMetrics
      ? report.totals.remindersCompleted
      : null,
    report.config.includeSummaryMetrics ? report.totals.meetingsAttended : null,
    report.config.includeSummaryMetrics ? report.followUpDecisions : null,
    report.config.includeSummaryMetrics ? report.totals.plannedItems : null,
    report.config.includeSummaryMetrics ? report.totals.completedItems : null,
    report.config.includeSummaryMetrics ? planCompletion(report.totals) : null,
    report.config.includeStatus ? report.workStatus.pending : null,
    report.config.includeStatus ? report.workStatus.inProgress : null,
    report.config.includeStatus ? report.workStatus.waiting : null,
    report.config.includeStatus ? report.workStatus.resolved : null,
    null,
    null,
    null,
    null,
    followUpReasons,
  ]);

  return `\uFEFF${[
    headers.join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n")}\r\n`;
}

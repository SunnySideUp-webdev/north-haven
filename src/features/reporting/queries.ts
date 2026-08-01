import "server-only";

import {
  dateKeyForInstant,
  getMonthRange,
  monthKeyForInstant,
  normalizeMonthKey,
} from "@/features/reporting/date";
import type {
  DailyMetric,
  MonthlyCalendarView,
} from "@/features/reporting/types";
import { requireAuthenticatedContext } from "@/server/auth/session";

function number(value: number | null) {
  return value ?? 0;
}

export async function getMonthlyCalendar(
  requestedMonth?: string,
): Promise<MonthlyCalendarView> {
  const { profile, supabase } = await requireAuthenticatedContext();
  const timeZone = profile?.time_zone ?? "America/Guatemala";
  const now = new Date();
  const currentMonth = monthKeyForInstant(now, timeZone);
  const monthKey = normalizeMonthKey(requestedMonth, currentMonth);
  const range = getMonthRange(monthKey);

  const [{ data: rows, error }, { data: monthNote, error: noteError }] =
    await Promise.all([
      supabase.rpc("reporting_daily_metrics", {
        chosen_end_date: range.gridEnd,
        chosen_start_date: range.gridStart,
      }),
      supabase
        .from("month_notes")
        .select("body")
        .eq("month_start", range.monthStart)
        .maybeSingle(),
    ]);

  if (error) throw new Error("We couldn't load this month's work history.");
  if (noteError) throw new Error("We couldn't load the monthly note.");

  return {
    ...range,
    currentMonth,
    monthKey,
    monthNote: monthNote?.body ?? "",
    rows: (rows ?? []).map((row): DailyMetric => ({
      completedItems: number(row.completed_items),
      dayNote: row.day_note,
      deferredItems: number(row.deferred_items),
      hasImportantNote: row.has_important_note ?? false,
      isOutOfOffice: row.is_out_of_office ?? false,
      meetingsAttended: number(row.meetings_attended),
      planIntention: row.plan_intention,
      plannedItems: number(row.planned_items),
      planStatus: row.plan_status,
      remindersCompleted: number(row.reminders_completed),
      returnedItems: number(row.returned_items),
      skippedItems: number(row.skipped_items),
      tasksCompleted: number(row.tasks_completed),
      ticketsClosed: number(row.tickets_closed),
      ticketsResolved: number(row.tickets_resolved),
      ticketsWorked: number(row.tickets_worked),
      workDate: row.work_date,
    })),
    timeZone,
    today: dateKeyForInstant(now, timeZone),
  };
}

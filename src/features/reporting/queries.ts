import "server-only";

import {
  dateKeyForInstant,
  getInsightRange,
  getMonthRange,
  monthKeyForInstant,
  normalizeMonthKey,
} from "@/features/reporting/date";
import type {
  DailyMetric,
  InsightsView,
  InventoryMetric,
  MonthlyCalendarView,
  PeriodTotals,
} from "@/features/reporting/types";
import { requireAuthenticatedContext } from "@/server/auth/session";

function number(value: number | null) {
  return value ?? 0;
}

function decimal(value: number | string | null) {
  return Number(value ?? 0);
}

function mapDailyMetric(row: {
  completed_items: number | null;
  day_note: string | null;
  deferred_items: number | null;
  has_important_note: boolean | null;
  is_out_of_office: boolean | null;
  meetings_attended: number | null;
  plan_intention: string | null;
  planned_items: number | null;
  plan_status: string | null;
  reminders_completed: number | null;
  returned_items: number | null;
  skipped_items: number | null;
  tasks_completed: number | null;
  tickets_closed: number | null;
  tickets_resolved: number | null;
  tickets_worked: number | null;
  work_date: string;
}): DailyMetric {
  return {
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
  };
}

function mapPeriodTotals(
  row:
    | {
        completed_items: number | null;
        meetings_attended: number | null;
        planned_items: number | null;
        reminders_completed: number | null;
        tasks_completed: number | null;
        tickets_closed: number | null;
        tickets_resolved: number | null;
        tickets_worked: number | null;
      }
    | null
    | undefined,
): PeriodTotals {
  return {
    completedItems: number(row?.completed_items ?? 0),
    meetingsAttended: number(row?.meetings_attended ?? 0),
    plannedItems: number(row?.planned_items ?? 0),
    remindersCompleted: number(row?.reminders_completed ?? 0),
    tasksCompleted: number(row?.tasks_completed ?? 0),
    ticketsClosed: number(row?.tickets_closed ?? 0),
    ticketsResolved: number(row?.tickets_resolved ?? 0),
    ticketsWorked: number(row?.tickets_worked ?? 0),
  };
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
    rows: (rows ?? []).map(mapDailyMetric),
    timeZone,
    today: dateKeyForInstant(now, timeZone),
  };
}

export async function getInsights(request: {
  anchor?: string;
  end?: string;
  period?: string;
  start?: string;
}): Promise<InsightsView> {
  const { profile, supabase } = await requireAuthenticatedContext();
  const timeZone = profile?.time_zone ?? "America/Guatemala";
  const today = dateKeyForInstant(new Date(), timeZone);
  const range = getInsightRange({
    anchor: request.anchor,
    customEnd: request.end,
    customStart: request.start,
    period: request.period,
    today,
  });

  const [
    dailyResult,
    totalsResult,
    previousTotalsResult,
    inventoryResult,
    workStatusResult,
    scheduleResult,
  ] = await Promise.all([
    supabase.rpc("reporting_daily_metrics", {
      chosen_end_date: range.end,
      chosen_start_date: range.start,
    }),
    supabase.rpc("reporting_period_totals", {
      chosen_end_date: range.end,
      chosen_start_date: range.start,
    }),
    supabase.rpc("reporting_period_totals", {
      chosen_end_date: range.previousEnd,
      chosen_start_date: range.previousStart,
    }),
    supabase.rpc("reporting_inventory_metrics", {
      chosen_end_date: range.end,
      chosen_start_date: range.start,
    }),
    supabase.rpc("reporting_work_status_snapshot", {
      chosen_as_of_date: range.end,
    }),
    supabase.from("work_schedules").select("working_weekdays").maybeSingle(),
  ]);

  if (
    dailyResult.error ||
    totalsResult.error ||
    previousTotalsResult.error ||
    inventoryResult.error ||
    workStatusResult.error ||
    scheduleResult.error
  ) {
    throw new Error("We couldn't load Insights for this period.");
  }

  return {
    daily: (dailyResult.data ?? []).map(mapDailyMetric),
    end: range.end,
    inventory: (inventoryResult.data ?? []).map((row): InventoryMetric => ({
      activeTickets: number(row.active_tickets),
      age0To7: number(row.age_0_7),
      age15To30: number(row.age_15_30),
      age31Plus: number(row.age_31_plus),
      age8To14: number(row.age_8_14),
      averageActiveAge: decimal(row.average_active_age),
      ticketsReceived: number(row.tickets_received),
      waitingTickets: number(row.waiting_tickets),
      watchingTickets: number(row.watching_tickets),
      workDate: row.work_date,
    })),
    isPartial: range.isPartial,
    naturalEnd: range.naturalEnd,
    period: range.period,
    previousTotals: mapPeriodTotals(previousTotalsResult.data?.[0]),
    start: range.start,
    timeZone,
    today,
    totals: mapPeriodTotals(totalsResult.data?.[0]),
    workStatus: {
      active: number(workStatusResult.data?.[0]?.active_work ?? 0),
      total: number(workStatusResult.data?.[0]?.total_active ?? 0),
      waiting: number(workStatusResult.data?.[0]?.waiting ?? 0),
      watching: number(workStatusResult.data?.[0]?.watching ?? 0),
    },
    workingWeekdays: scheduleResult.data?.working_weekdays ?? [1, 2, 3, 4, 5],
  };
}

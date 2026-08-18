import "server-only";

import {
  dateKeyForInstant,
  getInsightRange,
  getMonthRange,
  monthKeyForInstant,
  normalizeMonthKey,
  shiftDateKey,
} from "@/features/reporting/date";
import {
  buildReportNarrative,
  defaultReportConfig,
  getReportRange,
  reportConfigSchema,
  type ReportConfig,
  type ReportFollowUp,
  type ReportTaskDetail,
  type ReportTicketDetail,
  type ReportView,
} from "@/features/reporting/reports";
import type {
  DailyMetric,
  InsightsView,
  InventoryMetric,
  MonthlyCalendarView,
  PeriodTotals,
  SavedCalendarDayColor,
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
  planned_reminders: number | null;
  planned_tasks: number | null;
  planned_tickets: number | null;
  plan_status: string | null;
  reminders_completed: number | null;
  returned_items: number | null;
  scheduled_meetings: number | null;
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
    plannedReminders: number(row.planned_reminders),
    plannedTasks: number(row.planned_tasks),
    plannedTickets: number(row.planned_tickets),
    planStatus: row.plan_status,
    remindersCompleted: number(row.reminders_completed),
    returnedItems: number(row.returned_items),
    scheduledMeetings: number(row.scheduled_meetings),
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

  const [
    { data: rows, error },
    { data: monthNote, error: noteError },
    { data: dayAppearances, error: appearanceError },
  ] = await Promise.all([
    supabase.rpc("reporting_daily_metrics", {
      chosen_end_date: range.gridEnd,
      chosen_start_date: range.gridStart,
    }),
    supabase
      .from("month_notes")
      .select("body")
      .eq("month_start", range.monthStart)
      .maybeSingle(),
    supabase
      .from("calendar_day_appearances")
      .select("work_date, color")
      .gte("work_date", range.gridStart)
      .lte("work_date", range.gridEnd),
  ]);

  if (error) throw new Error("We couldn't load this month's work history.");
  if (noteError) throw new Error("We couldn't load the monthly note.");
  if (appearanceError)
    throw new Error("We couldn't load the calendar appearance.");

  return {
    ...range,
    currentMonth,
    dayColors: Object.fromEntries(
      (dayAppearances ?? []).map((appearance) => [
        appearance.work_date,
        appearance.color as SavedCalendarDayColor,
      ]),
    ),
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
      inProgress: number(workStatusResult.data?.[0]?.in_progress ?? 0),
      pending: number(workStatusResult.data?.[0]?.pending ?? 0),
      resolved: number(workStatusResult.data?.[0]?.resolved ?? 0),
      total: number(workStatusResult.data?.[0]?.total_active ?? 0),
      waiting: number(workStatusResult.data?.[0]?.waiting ?? 0),
      watching: number(workStatusResult.data?.[0]?.watching ?? 0),
    },
    workingWeekdays: scheduleResult.data?.working_weekdays ?? [1, 2, 3, 4, 5],
  };
}

export async function getInitialReport(): Promise<ReportView> {
  const { profile } = await requireAuthenticatedContext();
  const timeZone = profile?.time_zone ?? "America/Guatemala";
  const today = dateKeyForInstant(new Date(), timeZone);
  return getReport(defaultReportConfig(today));
}

export async function getReport(input: ReportConfig): Promise<ReportView> {
  const config = reportConfigSchema.parse(input);
  const { profile, supabase } = await requireAuthenticatedContext();
  const timeZone = profile?.time_zone ?? "America/Guatemala";
  const today = dateKeyForInstant(new Date(), timeZone);
  const { data: schedule, error: scheduleError } = await supabase
    .from("work_schedules")
    .select("working_weekdays, starts_at_local, ends_at_local")
    .maybeSingle();

  if (scheduleError) throw new Error("We couldn't load your work schedule.");

  const workingWeekdays = schedule?.working_weekdays ?? [1, 2, 3, 4, 5];
  const range = getReportRange({
    anchor: config.anchor,
    period: config.period,
    today,
    workingWeekdays,
  });
  const span = Math.round(
    (new Date(`${range.end}T12:00:00Z`).valueOf() -
      new Date(`${range.start}T12:00:00Z`).valueOf()) /
      86_400_000,
  );
  const previousEnd = shiftDateKey(range.start, -1);
  const previousStart = shiftDateKey(previousEnd, -span);

  const [
    dailyResult,
    totalsResult,
    previousResult,
    inventoryResult,
    statusResult,
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
      chosen_end_date: previousEnd,
      chosen_start_date: previousStart,
    }),
    supabase.rpc("reporting_inventory_metrics", {
      chosen_end_date: range.end,
      chosen_start_date: range.start,
    }),
    supabase.rpc("reporting_work_status_snapshot", {
      chosen_as_of_date: range.end,
    }),
  ]);

  if (
    dailyResult.error ||
    totalsResult.error ||
    previousResult.error ||
    inventoryResult.error ||
    statusResult.error
  ) {
    throw new Error("We couldn't prepare this report.");
  }

  const daily = (dailyResult.data ?? []).map(mapDailyMetric);
  const inventory = (inventoryResult.data ?? []).map(
    (row): InventoryMetric => ({
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
    }),
  );
  const totals = mapPeriodTotals(totalsResult.data?.[0]);
  const workStatus = {
    active: number(statusResult.data?.[0]?.active_work ?? 0),
    inProgress: number(statusResult.data?.[0]?.in_progress ?? 0),
    pending: number(statusResult.data?.[0]?.pending ?? 0),
    resolved: number(statusResult.data?.[0]?.resolved ?? 0),
    total: number(statusResult.data?.[0]?.total_active ?? 0),
    waiting: number(statusResult.data?.[0]?.waiting ?? 0),
    watching: number(statusResult.data?.[0]?.watching ?? 0),
  };

  const { data: nextWorkday } = await supabase.rpc("next_workday", {
    chosen_after_date: range.end,
  });
  const followUpStart = nextWorkday ?? shiftDateKey(range.end, 1);
  const followUpEnd = shiftDateKey(followUpStart, 6);
  const { data: followUpRows, error: followUpError } = await supabase
    .from("follow_ups")
    .select("work_item_id, reason, waiting_on, review_on")
    .eq("state", "open")
    .gte("review_on", followUpStart)
    .lte("review_on", followUpEnd)
    .order("review_on");

  if (followUpError) throw new Error("We couldn't load follow-up reviews.");

  const { data: decisionRows, error: decisionError } = await supabase
    .from("follow_ups")
    .select("completed_at")
    .not("completed_at", "is", null)
    .gte("completed_at", `${shiftDateKey(range.start, -1)}T00:00:00.000Z`)
    .lte("completed_at", `${shiftDateKey(range.end, 1)}T23:59:59.999Z`);
  if (decisionError) throw new Error("We couldn't load follow-up decisions.");
  const decisionsByDate = new Map<string, number>();
  for (const row of decisionRows ?? []) {
    if (!row.completed_at) continue;
    const decisionDate = dateKeyForInstant(
      new Date(row.completed_at),
      timeZone,
    );
    if (decisionDate < range.start || decisionDate > range.end) continue;
    decisionsByDate.set(
      decisionDate,
      (decisionsByDate.get(decisionDate) ?? 0) + 1,
    );
  }
  const followUpDecisionsByDate = [...decisionsByDate.entries()].map(
    ([workDate, count]) => ({ count, workDate }),
  );
  const followUpDecisions = followUpDecisionsByDate.reduce(
    (sum, row) => sum + row.count,
    0,
  );

  let taskDetails: ReportTaskDetail[] = [];
  let ticketDetails: ReportTicketDetail[] = [];
  if (config.includeTaskDetails || config.includeTicketDetails) {
    const { data: logRows, error: logError } = await supabase
      .from("work_logs")
      .select("work_item_id, worked_on")
      .gte("worked_on", range.start)
      .lte("worked_on", range.end)
      .order("worked_on");
    if (logError) throw new Error("We couldn't load work details.");

    const datesByItem = new Map<string, Set<string>>();
    for (const row of logRows ?? []) {
      const dates = datesByItem.get(row.work_item_id) ?? new Set<string>();
      dates.add(row.worked_on);
      datesByItem.set(row.work_item_id, dates);
    }
    const ids = [...datesByItem.keys()];
    if (ids.length && config.includeTicketDetails) {
      const { data: ticketItems, error: ticketError } = await supabase
        .from("work_inventory_rows")
        .select("id, title, ticket_number")
        .eq("kind", "ticket")
        .in("id", ids)
        .order("ticket_number")
        .order("title");
      if (ticketError) throw new Error("We couldn't load ticket details.");
      ticketDetails = (ticketItems ?? []).flatMap((item) => {
        if (!item.id || !item.ticket_number || !item.title) return [];

        return [
          {
            ticketNumber: item.ticket_number,
            title: item.title,
            workDates: [...(datesByItem.get(item.id) ?? [])],
            workItemId: item.id,
          },
        ];
      });
    }
    if (ids.length && config.includeTaskDetails) {
      const { data: taskItems, error: taskError } = await supabase
        .from("work_inventory_rows")
        .select("id, title")
        .eq("kind", "task")
        .in("id", ids)
        .order("title");
      if (taskError) throw new Error("We couldn't load task details.");
      taskDetails = (taskItems ?? []).flatMap((item) => {
        if (!item.id || !item.title) return [];

        return [
          {
            title: item.title,
            workDates: [...(datesByItem.get(item.id) ?? [])],
            workItemId: item.id,
          },
        ];
      });
    }
  }

  let followUps: ReportFollowUp[] = [];
  if (config.includeFollowUpReasons && followUpRows?.length) {
    const ids = [...new Set(followUpRows.map((row) => row.work_item_id))];
    const { data: items, error: itemError } = await supabase
      .from("work_inventory_rows")
      .select("id, title, ticket_number")
      .in("id", ids);
    if (itemError) throw new Error("We couldn't load follow-up details.");
    const itemsById = new Map((items ?? []).map((item) => [item.id, item]));
    followUps = followUpRows
      .filter((row): row is typeof row & { review_on: string } =>
        Boolean(row.review_on),
      )
      .map((row) => {
        const item = itemsById.get(row.work_item_id);
        return {
          reason: row.reason,
          reviewOn: row.review_on,
          ticketNumber: item?.ticket_number ?? null,
          title: item?.title ?? "Follow-up",
          waitingOn: row.waiting_on,
        };
      });
  }

  const hasData = Boolean(
    totals.ticketsWorked ||
    totals.ticketsResolved ||
    totals.ticketsClosed ||
    totals.tasksCompleted ||
    totals.remindersCompleted ||
    totals.meetingsAttended ||
    totals.plannedItems ||
    inventory.some((row) => row.activeTickets || row.ticketsReceived) ||
    daily.some((row) => row.dayNote || row.isOutOfOffice),
  );

  return {
    config: {
      ...config,
      anchor: config.anchor <= today ? config.anchor : today,
    },
    daily,
    dayNotes: config.includeDayNotes
      ? daily
          .filter((row): row is DailyMetric & { dayNote: string } =>
            Boolean(row.dayNote),
          )
          .map((row) => ({
            body: row.dayNote,
            isImportant: row.hasImportantNote,
            workDate: row.workDate,
          }))
      : [],
    end: range.end,
    followUpDecisions,
    followUpDecisionsByDate,
    followUpDueCount: followUpRows?.length ?? 0,
    followUps,
    generatedAt: new Date().toISOString(),
    hasData,
    inventory,
    isPartial: range.isPartial,
    narrative: buildReportNarrative({
      daily,
      inventory,
      period: config.period,
      totals,
      workStatus,
    }),
    naturalEnd: range.naturalEnd,
    previousTotals: mapPeriodTotals(previousResult.data?.[0]),
    schedule: {
      endsAtLocal: schedule?.ends_at_local ?? "17:00:00",
      startsAtLocal: schedule?.starts_at_local ?? "08:00:00",
      workingWeekdays,
    },
    start: range.start,
    taskDetails,
    ticketDetails,
    timeZone,
    today,
    totals,
    workStatus,
  };
}

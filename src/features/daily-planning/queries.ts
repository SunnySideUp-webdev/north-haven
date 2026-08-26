import "server-only";

import { getCalendarDay } from "@/features/calendar-sync/queries";
import {
  buildPlanningItems,
  type OtherPlanAssignment,
} from "@/features/daily-planning/planning-items";
import { getWorkInventory } from "@/features/work-items/queries";
import { requireAuthenticatedContext } from "@/server/auth/session";

export async function getDailyPlanningData(workDate: string) {
  const { profile, supabase } = await requireAuthenticatedContext();
  const [
    { data: plan, error: planError },
    inventory,
    calendar,
    { data: schedule },
    { data: dayNote, error: dayNoteError },
  ] = await Promise.all([
    supabase
      .from("daily_plans")
      .select("id, work_date, status, intention, closed_at, end_of_day_step")
      .eq("work_date", workDate)
      .maybeSingle(),
    getWorkInventory(),
    getCalendarDay(workDate),
    supabase
      .from("work_schedules")
      .select("starts_at_local, ends_at_local, working_weekdays")
      .maybeSingle(),
    supabase
      .from("day_notes")
      .select("body, is_important")
      .eq("work_date", workDate)
      .maybeSingle(),
  ]);

  if (planError) throw new Error("We couldn't load this daily plan.");
  if (dayNoteError) throw new Error("We couldn't load the day note.");

  const { data: planItems, error: itemsError } = plan
    ? await supabase
        .from("daily_plan_items")
        .select("id, work_item_id, position, execution_status")
        .eq("daily_plan_id", plan.id)
        .order("position")
    : { data: [], error: null };

  if (itemsError) throw new Error("We couldn't load planned work.");

  const { data: otherPlanAssignments, error: otherPlanAssignmentsError } =
    await supabase
      .from("daily_plan_items")
      .select(
        "work_item_id, execution_status, daily_plans!daily_plan_items_daily_plan_id_workspace_id_fkey!inner(work_date, status)",
      )
      .neq("daily_plans.work_date", workDate)
      .in("execution_status", ["planned", "in_progress", "done"]);

  if (otherPlanAssignmentsError) {
    throw new Error("We couldn't load planned work.");
  }

  const items = buildPlanningItems({
    inventory,
    otherPlanAssignments:
      otherPlanAssignments as unknown as OtherPlanAssignment[],
    planItems,
  });

  const [
    { data: nextWorkDate },
    { data: previousWorkDate },
    { data: nextPlanningDate },
    { data: previousPlanningDate },
  ] = await Promise.all([
    supabase.rpc("next_workday", { chosen_after_date: workDate }),
    supabase.rpc("previous_workday", { chosen_before_date: workDate }),
    supabase.rpc("next_plannable_date", { chosen_after_date: workDate }),
    supabase.rpc("previous_plannable_date", {
      chosen_before_date: workDate,
    }),
  ]);
  const { count: dueFollowUps } = await supabase
    .from("follow_ups")
    .select("id", { count: "exact", head: true })
    .eq("state", "open")
    .lte("review_on", workDate);

  return {
    calendar,
    dayNote,
    dueFollowUps: dueFollowUps ?? 0,
    items,
    nextPlanningDate,
    nextWorkDate,
    previousPlanningDate,
    previousWorkDate,
    plan,
    schedule,
    timeZone: profile?.time_zone ?? "America/Guatemala",
  };
}

export async function getEndOfDayData(workDate: string) {
  const planning = await getDailyPlanningData(workDate);
  const { supabase } = await requireAuthenticatedContext();
  const [{ data: followUps }, { data: nextPlan }] = await Promise.all([
    supabase
      .from("follow_ups")
      .select("id, work_item_id, reason, waiting_on, review_on")
      .eq("state", "open")
      .lte("review_on", workDate)
      .order("review_on"),
    planning.nextWorkDate
      ? supabase
          .from("daily_plans")
          .select("id, status")
          .eq("work_date", planning.nextWorkDate)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const titleById = new Map(
    planning.items.map((item) => [item.id, item.title ?? "Work item"]),
  );
  const nextDayPlanning = planning.nextWorkDate
    ? await getDailyPlanningData(planning.nextWorkDate)
    : null;

  return {
    ...planning,
    followUps: (followUps ?? []).map((followUp) => ({
      ...followUp,
      title: titleById.get(followUp.work_item_id) ?? "Work item",
    })),
    nextPlan,
    nextDayPlanning,
  };
}

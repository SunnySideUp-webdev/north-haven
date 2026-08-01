import "server-only";

import { getCalendarDay } from "@/features/calendar-sync/queries";
import { getWorkInventory } from "@/features/work-items/queries";
import { requireAuthenticatedContext } from "@/server/auth/session";

export async function getDailyPlanningData(workDate: string) {
  const { profile, supabase } = await requireAuthenticatedContext();
  const [
    { data: plan, error: planError },
    inventory,
    calendar,
    { data: schedule },
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
  ]);

  if (planError) throw new Error("We couldn't load this daily plan.");

  const { data: planItems, error: itemsError } = plan
    ? await supabase
        .from("daily_plan_items")
        .select("id, work_item_id, position, execution_status")
        .eq("daily_plan_id", plan.id)
        .order("position")
    : { data: [], error: null };

  if (itemsError) throw new Error("We couldn't load planned work.");

  const selectedByWorkId = new Map(
    planItems.map((item) => [item.work_item_id, item]),
  );
  const items = inventory
    .filter(
      (item) =>
        item.id &&
        (selectedByWorkId.has(item.id) ||
          item.tracking_state === "active" ||
          item.tracking_state === "watching"),
    )
    .map((item) => ({
      ...item,
      planItem: selectedByWorkId.get(item.id!) ?? null,
    }));

  const [{ data: nextWorkDate }, { data: previousWorkDate }] =
    await Promise.all([
      supabase.rpc("next_workday", { chosen_after_date: workDate }),
      supabase.rpc("previous_workday", { chosen_before_date: workDate }),
    ]);
  const { count: dueFollowUps } = await supabase
    .from("follow_ups")
    .select("id", { count: "exact", head: true })
    .eq("state", "open")
    .lte("review_on", workDate);

  return {
    calendar,
    dueFollowUps: dueFollowUps ?? 0,
    items,
    nextWorkDate,
    previousWorkDate,
    plan,
    schedule,
    timeZone: profile?.time_zone ?? "America/Guatemala",
  };
}

export async function getEndOfDayData(workDate: string) {
  const planning = await getDailyPlanningData(workDate);
  const { supabase } = await requireAuthenticatedContext();
  const [{ data: dayNote }, { data: followUps }, { data: nextPlan }] =
    await Promise.all([
      supabase
        .from("day_notes")
        .select("body, is_important")
        .eq("work_date", workDate)
        .maybeSingle(),
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
    dayNote,
    followUps: (followUps ?? []).map((followUp) => ({
      ...followUp,
      title: titleById.get(followUp.work_item_id) ?? "Work item",
    })),
    nextPlan,
    nextDayPlanning,
  };
}

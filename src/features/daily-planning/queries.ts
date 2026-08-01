import "server-only";

import { getWorkInventory } from "@/features/work-items/queries";
import { requireAuthenticatedContext } from "@/server/auth/session";

export async function getDailyPlanningData(workDate: string) {
  const { profile, supabase } = await requireAuthenticatedContext();
  const [{ data: plan, error: planError }, inventory] = await Promise.all([
    supabase
      .from("daily_plans")
      .select("id, work_date, status, intention, closed_at")
      .eq("work_date", workDate)
      .maybeSingle(),
    getWorkInventory(),
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
        (item.tracking_state === "active" ||
          item.tracking_state === "watching"),
    )
    .map((item) => ({
      ...item,
      planItem: selectedByWorkId.get(item.id!) ?? null,
    }));

  const { data: nextWorkDate } = await supabase.rpc("next_workday", {
    chosen_after_date: workDate,
  });
  const { count: dueFollowUps } = await supabase
    .from("follow_ups")
    .select("id", { count: "exact", head: true })
    .eq("state", "open")
    .lte("review_on", workDate);

  return {
    dueFollowUps: dueFollowUps ?? 0,
    items,
    nextWorkDate,
    plan,
    timeZone: profile?.time_zone ?? "America/Guatemala",
  };
}

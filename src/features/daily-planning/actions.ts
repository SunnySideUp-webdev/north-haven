"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthenticatedContext } from "@/server/auth/session";

const date = z.string().date();
const uuid = z.string().uuid();

export type PlanningActionResult = { ok: boolean; message?: string };

export async function setPlanSelectionAction(input: {
  selected: boolean;
  workDate: string;
  workItemId: string;
}): Promise<PlanningActionResult> {
  const result = z
    .object({ selected: z.boolean(), workDate: date, workItemId: uuid })
    .safeParse(input);
  if (!result.success)
    return { ok: false, message: "Invalid planning selection." };

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("set_plan_item_selected", {
    chosen_selected: result.data.selected,
    chosen_work_date: result.data.workDate,
    target_work_item_id: result.data.workItemId,
  });
  if (error) return { ok: false, message: "We couldn't update this plan." };
  revalidatePath("/plan");
  revalidatePath("/today");
  return { ok: true };
}

export async function movePlanItemAction(input: {
  direction: -1 | 1;
  planItemId: string;
}): Promise<PlanningActionResult> {
  const result = z
    .object({
      direction: z.union([z.literal(-1), z.literal(1)]),
      planItemId: uuid,
    })
    .safeParse(input);
  if (!result.success) return { ok: false, message: "Invalid plan position." };
  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("move_daily_plan_item", {
    chosen_direction: result.data.direction,
    target_daily_plan_item_id: result.data.planItemId,
  });
  if (error) return { ok: false, message: "We couldn't reorder this plan." };
  revalidatePath("/plan");
  revalidatePath("/today");
  return { ok: true };
}

export async function savePlanDetailsAction(input: {
  intention: string;
  markReady: boolean;
  workDate: string;
}): Promise<PlanningActionResult> {
  const result = z
    .object({
      intention: z.string().trim().max(240),
      markReady: z.boolean(),
      workDate: date,
    })
    .safeParse(input);
  if (!result.success)
    return { ok: false, message: "Review the plan details." };
  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("update_daily_plan_details", {
    chosen_intention: result.data.intention,
    chosen_mark_ready: result.data.markReady,
    chosen_work_date: result.data.workDate,
  });
  if (error)
    return {
      ok: false,
      message: error.message.includes("at least one")
        ? "Choose at least one item before marking this plan ready."
        : "We couldn't save this plan.",
    };
  revalidatePath("/plan");
  revalidatePath("/today");
  return { ok: true };
}

export async function setPlanItemDoneAction(input: {
  done: boolean;
  planItemId: string;
}): Promise<PlanningActionResult> {
  const result = z
    .object({ done: z.boolean(), planItemId: uuid })
    .safeParse(input);
  if (!result.success) return { ok: false, message: "Invalid work item." };
  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("set_daily_plan_item_done", {
    chosen_done: result.data.done,
    target_daily_plan_item_id: result.data.planItemId,
  });
  if (error)
    return { ok: false, message: "We couldn't update today's progress." };
  revalidatePath("/today");
  revalidatePath("/plan");
  return { ok: true };
}

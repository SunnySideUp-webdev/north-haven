"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  isBlockingPlanAssignment,
  isCompletedPlanningCandidate,
  type OtherPlanAssignment,
} from "@/features/daily-planning/planning-items";
import type { WorkInventoryRow } from "@/features/work-items/types";
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
  if (result.data.selected) {
    const { data: existingPlanItems, error: existingPlanItemsError } =
      await supabase
        .from("daily_plan_items")
        .select(
          "work_item_id, execution_status, daily_plans!daily_plan_items_daily_plan_id_workspace_id_fkey!inner(work_date, status)",
        )
        .eq("work_item_id", result.data.workItemId)
        .neq("daily_plans.work_date", result.data.workDate)
        .in("execution_status", ["planned", "in_progress", "done"])
        .limit(5);

    if (existingPlanItemsError) {
      return { ok: false, message: "We couldn't update this plan." };
    }

    if (
      (
        existingPlanItems as unknown as OtherPlanAssignment[]
      ).some((assignment) => isBlockingPlanAssignment(assignment))
    ) {
      return {
        ok: false,
        message: "This item is already planned or completed on another day.",
      };
    }

    const { data: workItem, error: workItemError } = await supabase
      .from("work_inventory_rows")
      .select(
        "kind, operational_status, resolved_at, task_completed_at, reminder_acknowledged_at",
      )
      .eq("id", result.data.workItemId)
      .maybeSingle();

    if (workItemError) {
      return { ok: false, message: "We couldn't update this plan." };
    }

    if (
      workItem &&
      isCompletedPlanningCandidate(workItem as unknown as WorkInventoryRow)
    ) {
      return {
        ok: false,
        message: "This item is already completed.",
      };
    }
  }

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

export async function setEndOfDayStepAction(input: {
  step: number;
  workDate: string;
}): Promise<PlanningActionResult> {
  const result = z
    .object({ step: z.number().int().min(1).max(4), workDate: date })
    .safeParse(input);
  if (!result.success)
    return { ok: false, message: "Invalid End of Day step." };
  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("set_end_of_day_step", {
    chosen_step: result.data.step,
    chosen_work_date: result.data.workDate,
  });
  if (error)
    return { ok: false, message: "We couldn't save your End of Day progress." };
  revalidatePath("/end-of-day");
  return { ok: true };
}

export async function saveDayNoteAction(input: {
  body: string;
  important: boolean;
  workDate: string;
}): Promise<PlanningActionResult> {
  const result = z
    .object({
      body: z.string().trim().max(10_000),
      important: z.boolean(),
      workDate: date,
    })
    .safeParse(input);
  if (!result.success) return { ok: false, message: "Review the day note." };
  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("save_day_note", {
    chosen_body: result.data.body,
    chosen_is_important: result.data.important,
    chosen_work_date: result.data.workDate,
  });
  if (error) return { ok: false, message: "We couldn't save the day note." };
  revalidatePath("/end-of-day");
  revalidatePath("/today");
  return { ok: true };
}

export async function applyEndOfDayOutcomeAction(input: {
  deferredDate?: string;
  outcome: "done" | "returned" | "deferred" | "watching" | "skipped";
  planItemId: string;
}): Promise<PlanningActionResult> {
  const result = z
    .object({
      deferredDate: date.optional(),
      outcome: z.enum(["done", "returned", "deferred", "watching", "skipped"]),
      planItemId: uuid,
    })
    .safeParse(input);
  if (
    !result.success ||
    (result.data.outcome === "deferred" && !result.data.deferredDate)
  )
    return { ok: false, message: "Choose a valid outcome and future date." };
  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("apply_end_of_day_outcome", {
    chosen_deferred_date: result.data.deferredDate,
    chosen_outcome: result.data.outcome,
    target_daily_plan_item_id: result.data.planItemId,
  });
  if (error)
    return {
      ok: false,
      message: error.message.includes("future work date")
        ? "Choose a future work date."
        : "We couldn't save this outcome.",
    };
  revalidatePath("/end-of-day");
  revalidatePath("/today");
  revalidatePath("/plan");
  return { ok: true };
}

export async function resolveEndOfDayFollowUpAction(input: {
  decision:
    | "still_waiting"
    | "response_received"
    | "external_completed"
    | "no_longer_relevant";
  followUpId: string;
  reviewOn?: string;
}): Promise<PlanningActionResult> {
  const result = z
    .object({
      decision: z.enum([
        "still_waiting",
        "response_received",
        "external_completed",
        "no_longer_relevant",
      ]),
      followUpId: uuid,
      reviewOn: date.optional(),
    })
    .safeParse(input);
  if (
    !result.success ||
    (result.data.decision === "still_waiting" && !result.data.reviewOn)
  )
    return { ok: false, message: "Choose a follow-up decision." };
  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("resolve_end_of_day_follow_up", {
    chosen_decision: result.data.decision,
    chosen_review_on: result.data.reviewOn,
    target_follow_up_id: result.data.followUpId,
  });
  if (error)
    return {
      ok: false,
      message: error.message.includes("future review")
        ? "Choose a future review date."
        : "We couldn't save this follow-up decision.",
    };
  revalidatePath("/end-of-day");
  revalidatePath("/work");
  return { ok: true };
}

export async function finishEndOfDayAction(input: {
  workDate: string;
}): Promise<PlanningActionResult> {
  const result = z.object({ workDate: date }).safeParse(input);
  if (!result.success) return { ok: false, message: "Invalid work date." };
  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("finish_end_of_day", {
    chosen_work_date: result.data.workDate,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/end-of-day");
  revalidatePath("/today");
  revalidatePath("/plan");
  return { ok: true };
}

export async function reopenClosedDayAction(input: {
  workDate: string;
}): Promise<PlanningActionResult> {
  const result = z.object({ workDate: date }).safeParse(input);
  if (!result.success) return { ok: false, message: "Invalid work date." };
  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("reopen_closed_day", {
    chosen_work_date: result.data.workDate,
  });
  if (error) {
    return { ok: false, message: "We couldn't reopen this closed day." };
  }
  revalidatePath("/end-of-day");
  revalidatePath("/calendar");
  revalidatePath("/insights");
  return { ok: true };
}

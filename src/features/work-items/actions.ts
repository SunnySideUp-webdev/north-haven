"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { WorkFormState } from "@/features/work-items/types";
import {
  createTicketTypeInputSchema,
  followUpInputSchema,
  manageTicketTypeInputSchema,
  noteInputSchema,
  reminderInputSchema,
  taskInputSchema,
  ticketInputSchema,
  ticketWorkflowInputSchema,
  transitionFollowUpInputSchema,
} from "@/features/work-items/validation";
import { requireAuthenticatedContext } from "@/server/auth/session";

function errorState(message: string): WorkFormState {
  return { message, status: "error" };
}

function databaseMessage(message: string | undefined, noun: string) {
  if (message?.includes("normalized_ticket_number")) {
    return "That ticket number already exists in your workspace.";
  }

  return `We couldn't save this ${noun}. Review the details and try again.`;
}

export async function createTicketAction(
  _previousState: WorkFormState,
  formData: FormData,
): Promise<WorkFormState> {
  const result = ticketInputSchema.safeParse({
    description: formData.get("description"),
    externalUrl: formData.get("externalUrl"),
    formBackupComplete: formData.get("formBackupComplete") === "on",
    note: formData.get("note"),
    operationalStatus: formData.get("operationalStatus"),
    receivedAt: formData.get("receivedAt"),
    systemPriority: formData.get("systemPriority"),
    ticketNumber: formData.get("ticketNumber"),
    ticketTypeId: formData.get("ticketTypeId"),
    title: formData.get("title"),
  });

  if (!result.success) {
    return errorState(
      "Review the required fields, dates, and secure ticket link.",
    );
  }

  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase.rpc("create_ticket", {
    chosen_description: result.data.description ?? "",
    chosen_external_url: result.data.externalUrl,
    chosen_form_backup_complete: result.data.formBackupComplete,
    chosen_note: result.data.note ?? "",
    chosen_operational_status: result.data.operationalStatus,
    chosen_received_at: result.data.receivedAt,
    chosen_system_priority: result.data.systemPriority,
    chosen_ticket_number: result.data.ticketNumber,
    chosen_ticket_type_id: result.data.ticketTypeId,
    chosen_title: result.data.title,
  });

  if (error || !data) {
    if (error?.message.includes("normalized_ticket_number")) {
      const { data: existingWorkItemId } = await supabase.rpc(
        "find_ticket_by_number",
        { chosen_ticket_number: result.data.ticketNumber },
      );
      return {
        existingWorkItemId: existingWorkItemId ?? undefined,
        message: "That ticket number already exists in your workspace.",
        status: "error",
      };
    }
    return errorState(databaseMessage(error?.message, "ticket"));
  }

  revalidatePath("/work");
  if (formData.get("returnContext") === "end-of-day") {
    const context = z
      .object({
        intent: z.enum(["save", "add_another", "add_next"]),
        nextWorkDate: z.string().date(),
        workDate: z.string().date(),
      })
      .safeParse({
        intent: formData.get("intent") || "save",
        nextWorkDate: formData.get("nextWorkDate"),
        workDate: formData.get("workDate"),
      });

    if (context.success) {
      if (context.data.intent === "add_next") {
        const { error: planError } = await supabase.rpc(
          "set_plan_item_selected",
          {
            chosen_selected: true,
            chosen_work_date: context.data.nextWorkDate,
            target_work_item_id: data,
          },
        );
        if (planError)
          return errorState(
            "The ticket was saved, but it could not be added to the next plan.",
          );
      }
      revalidatePath("/end-of-day");
      revalidatePath("/plan");
      if (context.data.intent === "add_another") {
        redirect(
          `/work/new/ticket?context=end-of-day&date=${context.data.workDate}&nextDate=${context.data.nextWorkDate}`,
        );
      }
      redirect(`/end-of-day?date=${context.data.workDate}&step=1`);
    }
  }
  redirect(`/work/${data}`);
}

export async function createTaskAction(
  _previousState: WorkFormState,
  formData: FormData,
): Promise<WorkFormState> {
  const result = taskInputSchema.safeParse({
    description: formData.get("description"),
    dueAt: formData.get("dueAtIso"),
    title: formData.get("title"),
  });

  if (!result.success) {
    return errorState("Add a title and check the optional due date.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase.rpc("create_task", {
    chosen_description: result.data.description ?? "",
    chosen_due_at: result.data.dueAt || undefined,
    chosen_title: result.data.title,
  });

  if (error || !data) {
    return errorState(databaseMessage(error?.message, "task"));
  }

  revalidatePath("/work");
  redirect(`/work/${data}`);
}

export async function createReminderAction(
  _previousState: WorkFormState,
  formData: FormData,
): Promise<WorkFormState> {
  const result = reminderInputSchema.safeParse({
    description: formData.get("description"),
    remindAt: formData.get("remindAtIso"),
    title: formData.get("title"),
  });

  if (!result.success) {
    return errorState("Add a title and choose when you want to be reminded.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase.rpc("create_reminder", {
    chosen_description: result.data.description ?? "",
    chosen_remind_at: result.data.remindAt,
    chosen_title: result.data.title,
  });

  if (error || !data) {
    return errorState(databaseMessage(error?.message, "reminder"));
  }

  revalidatePath("/work");
  redirect(`/work/${data}`);
}

export async function updateTicketAction(
  _previousState: WorkFormState,
  formData: FormData,
): Promise<WorkFormState> {
  const result = ticketInputSchema.safeParse({
    description: formData.get("description"),
    externalUrl: formData.get("externalUrl"),
    formBackupComplete: formData.get("formBackupComplete") === "on",
    operationalStatus: formData.get("operationalStatus"),
    receivedAt: formData.get("receivedAt"),
    systemPriority: formData.get("systemPriority"),
    ticketNumber: formData.get("ticketNumber"),
    ticketTypeId: formData.get("ticketTypeId"),
    title: formData.get("title"),
    trackingState: formData.get("trackingState"),
    workItemId: formData.get("workItemId"),
  });

  if (
    !result.success ||
    !result.data.workItemId ||
    !result.data.trackingState
  ) {
    return errorState("Review the required ticket fields and try again.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("update_ticket", {
    chosen_description: result.data.description ?? "",
    chosen_external_url: result.data.externalUrl,
    chosen_form_backup_complete: result.data.formBackupComplete,
    chosen_operational_status: result.data.operationalStatus,
    chosen_received_at: result.data.receivedAt,
    chosen_system_priority: result.data.systemPriority,
    chosen_ticket_number: result.data.ticketNumber,
    chosen_ticket_type_id: result.data.ticketTypeId,
    chosen_title: result.data.title,
    chosen_tracking_state: result.data.trackingState,
    target_work_item_id: result.data.workItemId,
  });

  if (error) {
    return errorState(databaseMessage(error.message, "ticket"));
  }

  revalidatePath("/work");
  redirect(`/work/${result.data.workItemId}`);
}

export async function updateTicketWorkflowAction(input: {
  operationalStatus: string;
  systemPriority: string;
  trackingState: string;
  workItemId: string;
}): Promise<{ ok: boolean; message: string }> {
  const result = ticketWorkflowInputSchema.safeParse(input);
  if (!result.success) {
    return { ok: false, message: "Choose a valid ticket update." };
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("update_ticket_workflow", {
    chosen_operational_status: result.data.operationalStatus,
    chosen_system_priority: result.data.systemPriority,
    chosen_tracking_state: result.data.trackingState,
    target_work_item_id: result.data.workItemId,
  });

  if (error) {
    return {
      ok: false,
      message: error.message.includes("open daily plans")
        ? "Remove this ticket from its open plan before archiving it."
        : "We couldn't update this ticket. Try again.",
    };
  }

  revalidatePath("/work");
  revalidatePath(`/work/${result.data.workItemId}`);
  revalidatePath("/plan");
  revalidatePath("/today");
  revalidatePath("/calendar");
  revalidatePath("/insights");
  return { ok: true, message: "Changes saved." };
}

export async function updateTaskAction(
  _previousState: WorkFormState,
  formData: FormData,
): Promise<WorkFormState> {
  const result = taskInputSchema.safeParse({
    description: formData.get("description"),
    dueAt: formData.get("dueAtIso"),
    title: formData.get("title"),
    trackingState: formData.get("trackingState"),
    workItemId: formData.get("workItemId"),
  });

  if (
    !result.success ||
    !result.data.workItemId ||
    !result.data.trackingState
  ) {
    return errorState("Review the task details and try again.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("update_task", {
    chosen_description: result.data.description ?? "",
    chosen_due_at: result.data.dueAt || undefined,
    chosen_title: result.data.title,
    chosen_tracking_state: result.data.trackingState,
    target_work_item_id: result.data.workItemId,
  });

  if (error) {
    return errorState(databaseMessage(error.message, "task"));
  }

  revalidatePath("/work");
  redirect(`/work/${result.data.workItemId}`);
}

export async function updateReminderAction(
  _previousState: WorkFormState,
  formData: FormData,
): Promise<WorkFormState> {
  const result = reminderInputSchema.safeParse({
    description: formData.get("description"),
    remindAt: formData.get("remindAtIso"),
    title: formData.get("title"),
    trackingState: formData.get("trackingState"),
    workItemId: formData.get("workItemId"),
  });

  if (
    !result.success ||
    !result.data.workItemId ||
    !result.data.trackingState
  ) {
    return errorState("Review the reminder details and try again.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("update_reminder", {
    chosen_description: result.data.description ?? "",
    chosen_remind_at: result.data.remindAt,
    chosen_title: result.data.title,
    chosen_tracking_state: result.data.trackingState,
    target_work_item_id: result.data.workItemId,
  });

  if (error) {
    return errorState(databaseMessage(error.message, "reminder"));
  }

  revalidatePath("/work");
  redirect(`/work/${result.data.workItemId}`);
}

export async function restoreArchivedWorkItemAction(
  workItemId: string,
): Promise<{ ok: boolean; message?: string }> {
  const result = z.string().uuid().safeParse(workItemId);
  if (!result.success) return { ok: false, message: "Invalid work item." };
  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("restore_archived_work_item", {
    target_work_item_id: result.data,
  });
  if (error) {
    return { ok: false, message: "We couldn't restore this archived item." };
  }
  revalidatePath("/work");
  revalidatePath(`/work/${result.data}`);
  revalidatePath("/plan");
  return { ok: true };
}

const bulkInputSchema = z.object({
  workItemIds: z.array(z.string().uuid()).min(1).max(100),
});

export async function bulkAddToPlanAction(input: {
  workDate: string;
  workItemIds: string[];
}): Promise<{ ok: boolean; message: string }> {
  const result = bulkInputSchema
    .extend({ workDate: z.string().date() })
    .safeParse(input);
  if (!result.success)
    return { ok: false, message: "Choose work items and a valid work date." };

  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase.rpc("bulk_add_work_items_to_plan", {
    chosen_work_date: result.data.workDate,
    target_work_item_ids: result.data.workItemIds,
  });
  if (error)
    return { ok: false, message: "We couldn't add these items to the plan." };

  revalidatePath("/plan");
  revalidatePath("/today");
  return {
    ok: true,
    message: data
      ? `${data} ${data === 1 ? "item" : "items"} added to the plan.`
      : "Those items were already in the plan.",
  };
}

export async function bulkSetReviewDateAction(input: {
  reviewOn: string;
  workItemIds: string[];
}): Promise<{ ok: boolean; message: string }> {
  const result = bulkInputSchema
    .extend({ reviewOn: z.string().date() })
    .safeParse(input);
  if (!result.success)
    return { ok: false, message: "Choose work items and a valid review date." };

  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase.rpc("bulk_set_follow_up_review", {
    chosen_review_on: result.data.reviewOn,
    target_work_item_ids: result.data.workItemIds,
  });
  if (error)
    return { ok: false, message: "We couldn't update those review dates." };

  revalidatePath("/work");
  return {
    ok: true,
    message: data
      ? `${data} open ${data === 1 ? "follow-up" : "follow-ups"} updated.`
      : "None of the selected items has an open follow-up.",
  };
}

export async function bulkArchiveWorkItemsAction(input: {
  workItemIds: string[];
}): Promise<{ ok: boolean; message: string }> {
  const result = bulkInputSchema.safeParse(input);
  if (!result.success)
    return { ok: false, message: "Choose at least one work item." };

  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase.rpc("bulk_archive_work_items", {
    target_work_item_ids: result.data.workItemIds,
  });
  if (error)
    return {
      ok: false,
      message: error.message.includes("open daily plans")
        ? "Remove selected items from open daily plans before archiving them."
        : "We couldn't archive those items.",
    };

  revalidatePath("/work");
  revalidatePath("/plan");
  return {
    ok: true,
    message: `${data ?? 0} ${data === 1 ? "item" : "items"} archived. You can restore them from Archived.`,
  };
}

export async function deleteWorkItemAction(input: {
  workItemId: string;
}): Promise<{ ok: boolean; message: string }> {
  const result = z.object({ workItemId: z.string().uuid() }).safeParse(input);
  if (!result.success) return { ok: false, message: "Invalid work item." };

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("delete_work_item_permanently", {
    target_work_item_id: result.data.workItemId,
  });
  if (error) {
    return { ok: false, message: "We couldn't delete this item." };
  }

  revalidatePath("/work");
  revalidatePath("/plan");
  revalidatePath("/today");
  revalidatePath("/calendar");
  revalidatePath("/insights");
  return { ok: true, message: "Item deleted." };
}

export async function addWorkItemNoteAction(
  _previousState: WorkFormState,
  formData: FormData,
): Promise<WorkFormState> {
  const result = noteInputSchema.safeParse({
    body: formData.get("body"),
    workItemId: formData.get("workItemId"),
  });

  if (!result.success) {
    return errorState("Write a note before saving it.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("add_work_item_note", {
    chosen_body: result.data.body,
    target_work_item_id: result.data.workItemId,
  });

  if (error) {
    return errorState("We couldn't save this note. Try again.");
  }

  revalidatePath(`/work/${result.data.workItemId}`);
  return { status: "idle" };
}

export async function saveFollowUpAction(
  _previousState: WorkFormState,
  formData: FormData,
): Promise<WorkFormState> {
  const result = followUpInputSchema.safeParse({
    reason: formData.get("reason"),
    reviewOn: formData.get("reviewOn"),
    waitingOn: formData.get("waitingOn"),
    workItemId: formData.get("workItemId"),
  });

  if (!result.success) {
    return errorState("Add a reason and check the optional review date.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("save_open_follow_up", {
    chosen_reason: result.data.reason,
    chosen_review_on: result.data.reviewOn || undefined,
    chosen_waiting_on: result.data.waitingOn ?? "",
    target_work_item_id: result.data.workItemId,
  });

  if (error) {
    return errorState("We couldn't save this follow-up. Try again.");
  }

  revalidatePath(`/work/${result.data.workItemId}`);
  return { status: "idle" };
}

export async function createTicketTypeAction(
  _previousState: WorkFormState,
  formData: FormData,
): Promise<WorkFormState> {
  const result = createTicketTypeInputSchema.safeParse({
    name: formData.get("name"),
  });

  if (!result.success) {
    return errorState("Enter a ticket type name.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("create_ticket_type", {
    chosen_name: result.data.name,
  });

  if (error) {
    return errorState(
      error.message.includes("normalized_name")
        ? "A ticket type with this name already exists."
        : "We couldn't add this ticket type.",
    );
  }

  revalidatePath("/settings");
  revalidatePath("/work/new/ticket");
  return { status: "idle" };
}

export async function manageTicketTypeAction(
  _previousState: WorkFormState,
  formData: FormData,
): Promise<WorkFormState> {
  const result = manageTicketTypeInputSchema.safeParse({
    direction: formData.get("direction") || undefined,
    intent: formData.get("direction") ? "move" : "save",
    isActive: formData.get("isActive") === "on",
    name: formData.get("name"),
    ticketTypeId: formData.get("ticketTypeId"),
  });

  if (!result.success) {
    return errorState("Review this ticket type and try again.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error } =
    result.data.intent === "move" && result.data.direction
      ? await supabase.rpc("move_ticket_type", {
          chosen_direction: Number(result.data.direction),
          target_ticket_type_id: result.data.ticketTypeId,
        })
      : await supabase.rpc("update_ticket_type", {
          chosen_is_active: result.data.isActive,
          chosen_name: result.data.name,
          target_ticket_type_id: result.data.ticketTypeId,
        });

  if (error) {
    const message = error.message.includes("at least one active")
      ? "Keep at least one active ticket type."
      : error.message.includes("normalized_name")
        ? "A ticket type with this name already exists."
        : "We couldn't update this ticket type.";
    return errorState(message);
  }

  revalidatePath("/settings");
  revalidatePath("/work/new/ticket");
  return { status: "idle" };
}

export async function transitionFollowUpAction(
  _previousState: WorkFormState,
  formData: FormData,
): Promise<WorkFormState> {
  const result = transitionFollowUpInputSchema.safeParse({
    followUpId: formData.get("followUpId"),
    state: formData.get("state"),
    workItemId: formData.get("workItemId"),
  });

  if (!result.success) {
    return errorState("We couldn't identify this follow-up.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase.rpc("transition_follow_up", {
    chosen_state: result.data.state,
    target_follow_up_id: result.data.followUpId,
  });

  if (error) {
    return errorState(
      "We couldn't update this follow-up. Refresh and try again.",
    );
  }

  revalidatePath(`/work/${result.data.workItemId}`);
  revalidatePath("/work");
  return { status: "idle" };
}

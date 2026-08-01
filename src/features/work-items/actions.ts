"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { WorkFormState } from "@/features/work-items/types";
import {
  followUpInputSchema,
  noteInputSchema,
  reminderInputSchema,
  taskInputSchema,
  ticketInputSchema,
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
    return errorState(databaseMessage(error?.message, "ticket"));
  }

  revalidatePath("/work");
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

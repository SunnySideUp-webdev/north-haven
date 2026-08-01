import "server-only";

import { notFound } from "next/navigation";

import { requireAuthenticatedContext } from "@/server/auth/session";
import type { WorkInventoryRow } from "@/features/work-items/types";
import { todayInTimeZone } from "@/features/work-items/date";

export async function getWorkInventory(): Promise<WorkInventoryRow[]> {
  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase
    .from("work_inventory_rows")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error("We couldn't load your work inventory.");
  }

  return data;
}

export async function getTicketTypes() {
  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase
    .from("ticket_types")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) {
    throw new Error("We couldn't load ticket types.");
  }

  return data;
}

export async function getManagedTicketTypes() {
  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase
    .from("ticket_types")
    .select("id, name, is_active, sort_order")
    .order("sort_order")
    .order("name");

  if (error) {
    throw new Error("We couldn't load ticket type settings.");
  }

  return data;
}

export async function getWorkItem(workItemId: string) {
  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase
    .from("work_inventory_rows")
    .select("*")
    .eq("id", workItemId)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return data;
}

export async function getWorkItemActivity(workItemId: string) {
  const { supabase } = await requireAuthenticatedContext();
  const [notes, followUps, statusEvents, workLogs] = await Promise.all([
    supabase
      .from("work_item_notes")
      .select("id, body, is_pinned, created_at")
      .eq("work_item_id", workItemId)
      .order("created_at", { ascending: false }),
    supabase
      .from("follow_ups")
      .select(
        "id, reason, waiting_on, review_on, state, started_at, completed_at",
      )
      .eq("work_item_id", workItemId)
      .order("created_at", { ascending: false }),
    supabase
      .from("status_events")
      .select("id, status_dimension, from_value, to_value, changed_at")
      .eq("work_item_id", workItemId)
      .order("changed_at", { ascending: false })
      .limit(20),
    supabase
      .from("work_logs")
      .select("id, worked_on, outcome, started_at, ended_at, is_automatic")
      .eq("work_item_id", workItemId)
      .order("worked_on", { ascending: false })
      .limit(50),
  ]);

  if (notes.error || followUps.error || statusEvents.error || workLogs.error) {
    throw new Error("We couldn't load this item's activity.");
  }

  return {
    followUps: followUps.data,
    notes: notes.data,
    statusEvents: statusEvents.data,
    workLogs: workLogs.data,
  };
}

export async function getDefaultPlanDate() {
  const { profile } = await requireAuthenticatedContext();
  return todayInTimeZone(profile?.time_zone ?? "America/Guatemala");
}

import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import { describe, expect, it } from "vitest";

import type { Database } from "@/server/database/supabase/database.types";

const runLocalIntegration = Boolean(process.env.RUN_SUPABASE_INTEGRATION);
const localEnvironment = loadEnv("test", process.cwd(), "");

describe.skipIf(!runLocalIntegration)("local workspace RLS", () => {
  it("keeps two authenticated workspaces isolated", async () => {
    const url =
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      localEnvironment.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      localEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(url).toBeTruthy();
    expect(key).toBeTruthy();

    const clientA = createClient<Database>(url!, key!, {
      auth: { persistSession: false },
    });
    const clientB = createClient<Database>(url!, key!, {
      auth: { persistSession: false },
    });
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const password = "north-haven-integration-password";

    const { error: signUpErrorA } = await clientA.auth.signUp({
      email: `rls-a-${suffix}@example.com`,
      password,
    });
    const { error: signUpErrorB } = await clientB.auth.signUp({
      email: `rls-b-${suffix}@example.com`,
      password,
    });

    expect(signUpErrorA).toBeNull();
    expect(signUpErrorB).toBeNull();

    const { data: workspacesA, error: workspacesErrorA } = await clientA
      .from("workspaces")
      .select("id, name");
    const { data: workspacesB, error: workspacesErrorB } = await clientB
      .from("workspaces")
      .select("id, name");

    expect(workspacesErrorA).toBeNull();
    expect(workspacesErrorB).toBeNull();
    expect(workspacesA).toHaveLength(1);
    expect(workspacesB).toHaveLength(1);
    expect(workspacesA?.[0].id).not.toBe(workspacesB?.[0].id);

    const { data: attemptedUpdate, error: attemptedUpdateError } = await clientB
      .from("workspaces")
      .update({ name: "Cross-workspace update" })
      .eq("id", workspacesA![0].id)
      .select("id");

    expect(attemptedUpdateError).toBeNull();
    expect(attemptedUpdate).toEqual([]);

    const { data: workspaceAAfter } = await clientA
      .from("workspaces")
      .select("name")
      .eq("id", workspacesA![0].id)
      .single();

    expect(workspaceAAfter?.name).toBe("North Haven");

    const { data: ticketTypesA, error: ticketTypesErrorA } = await clientA
      .from("ticket_types")
      .select("id, name")
      .order("sort_order");

    expect(ticketTypesErrorA).toBeNull();
    expect(ticketTypesA?.map((type) => type.name)).toEqual([
      "Change",
      "Form",
      "Content",
      "Other",
    ]);

    const { data: redirectTypeId, error: createTypeError } = await clientA.rpc(
      "create_ticket_type",
      { chosen_name: "Redirect" },
    );
    const { error: duplicateTypeError } = await clientA.rpc(
      "create_ticket_type",
      { chosen_name: " redirect " },
    );

    expect(createTypeError).toBeNull();
    expect(redirectTypeId).toBeTruthy();
    expect(duplicateTypeError?.message).toContain("normalized_name");

    const { error: renameTypeError } = await clientA.rpc("update_ticket_type", {
      chosen_is_active: false,
      chosen_name: "URL redirect",
      target_ticket_type_id: redirectTypeId!,
    });
    const { error: crossWorkspaceTypeError } = await clientB.rpc(
      "update_ticket_type",
      {
        chosen_is_active: true,
        chosen_name: "Cross workspace",
        target_ticket_type_id: redirectTypeId!,
      },
    );

    expect(renameTypeError).toBeNull();
    expect(crossWorkspaceTypeError).not.toBeNull();

    const { error: moveTypeError } = await clientA.rpc("move_ticket_type", {
      chosen_direction: -1,
      target_ticket_type_id: redirectTypeId!,
    });
    const { data: reorderedTypes } = await clientA
      .from("ticket_types")
      .select("name")
      .order("sort_order")
      .order("name");

    expect(moveTypeError).toBeNull();
    expect(reorderedTypes?.map((type) => type.name)).toEqual([
      "Change",
      "Form",
      "Content",
      "URL redirect",
      "Other",
    ]);

    const { data: ticketId, error: ticketError } = await clientA.rpc(
      "create_ticket",
      {
        chosen_description: "Update the customer form.",
        chosen_external_url: "https://example.com/tickets/NH-101",
        chosen_form_backup_complete: false,
        chosen_note: "Request reviewed.",
        chosen_operational_status: "pending",
        chosen_received_at: "2026-07-30",
        chosen_system_priority: "urgent",
        chosen_ticket_number: " nh-101 ",
        chosen_ticket_type_id: ticketTypesA![0].id,
        chosen_title: "Update contact form",
      },
    );

    expect(ticketError).toBeNull();
    expect(ticketId).toBeTruthy();

    const { data: inventoryA, error: inventoryErrorA } = await clientA
      .from("work_inventory_rows")
      .select("id, kind, ticket_number, title, operational_status")
      .eq("id", ticketId!)
      .single();
    const { data: inventoryB, error: inventoryErrorB } = await clientB
      .from("work_inventory_rows")
      .select("id")
      .eq("id", ticketId!);

    expect(inventoryErrorA).toBeNull();
    expect(inventoryA).toMatchObject({
      kind: "ticket",
      operational_status: "pending",
      ticket_number: "nh-101",
      title: "Update contact form",
    });
    expect(inventoryErrorB).toBeNull();
    expect(inventoryB).toEqual([]);

    const { error: duplicateTicketError } = await clientA.rpc("create_ticket", {
      chosen_received_at: "2026-07-31",
      chosen_ticket_number: "NH-101",
      chosen_ticket_type_id: ticketTypesA![0].id,
      chosen_title: "Duplicate ticket",
    });

    expect(duplicateTicketError?.message).toContain("normalized_ticket_number");

    const { error: updateTicketError } = await clientA.rpc("update_ticket", {
      chosen_description: "Waiting for the final form changes.",
      chosen_external_url: "https://example.com/tickets/NH-101",
      chosen_form_backup_complete: true,
      chosen_operational_status: "waiting_response",
      chosen_received_at: "2026-07-30",
      chosen_system_priority: "urgent",
      chosen_ticket_number: "NH-101",
      chosen_ticket_type_id: ticketTypesA![0].id,
      chosen_title: "Update contact form",
      chosen_tracking_state: "watching",
      target_work_item_id: ticketId!,
    });

    expect(updateTicketError).toBeNull();

    const { data: statusEvents, error: statusEventsError } = await clientA
      .from("status_events")
      .select("status_dimension, to_value")
      .eq("work_item_id", ticketId!);

    expect(statusEventsError).toBeNull();
    expect(statusEvents).toEqual(
      expect.arrayContaining([
        { status_dimension: "tracking", to_value: "active" },
        { status_dimension: "operational", to_value: "pending" },
        { status_dimension: "tracking", to_value: "watching" },
        { status_dimension: "operational", to_value: "waiting_response" },
        { status_dimension: "backup", to_value: "complete" },
      ]),
    );

    const { data: followUpId, error: followUpError } = await clientA.rpc(
      "save_open_follow_up",
      {
        chosen_reason: "Waiting for the final form update.",
        chosen_review_on: "2026-08-03",
        chosen_waiting_on: "Forms team",
        target_work_item_id: ticketId!,
      },
    );

    expect(followUpError).toBeNull();

    const { error: transitionError } = await clientA.rpc(
      "transition_follow_up",
      {
        chosen_state: "completed",
        target_follow_up_id: followUpId!,
      },
    );

    expect(transitionError).toBeNull();

    const { data: completedFollowUp } = await clientA
      .from("follow_ups")
      .select("state, completed_at")
      .eq("id", followUpId!)
      .single();

    expect(completedFollowUp?.state).toBe("completed");
    expect(completedFollowUp?.completed_at).toBeTruthy();

    const { data: taskId, error: taskError } = await clientA.rpc(
      "create_task",
      {
        chosen_description: "Not tied to a ticket.",
        chosen_title: "Prepare weekly summary",
      },
    );
    const { data: reminderId, error: reminderError } = await clientA.rpc(
      "create_reminder",
      {
        chosen_remind_at: "2026-08-03T14:00:00.000Z",
        chosen_title: "Check the form changes",
      },
    );

    expect(taskError).toBeNull();
    expect(reminderError).toBeNull();

    const { data: distinctKinds } = await clientA
      .from("work_inventory_rows")
      .select("id, kind")
      .in("id", [taskId!, reminderId!]);

    expect(distinctKinds).toEqual(
      expect.arrayContaining([
        { id: taskId, kind: "task" },
        { id: reminderId, kind: "reminder" },
      ]),
    );

    const { data: mondayWorkday } = await clientA.rpc("next_workday", {
      chosen_after_date: "2026-07-31",
    });
    expect(mondayWorkday).toBe("2026-08-03");

    const { error: nonWorkingDayError } = await clientA
      .from("non_working_days")
      .insert({
        kind: "holiday",
        source: "manual",
        work_date: "2026-08-03",
        workspace_id: workspacesA![0].id,
      });
    const { data: tuesdayWorkday } = await clientA.rpc("next_workday", {
      chosen_after_date: "2026-07-31",
    });
    expect(nonWorkingDayError).toBeNull();
    expect(tuesdayWorkday).toBe("2026-08-04");

    for (const workItemId of [ticketId!, taskId!]) {
      const { error } = await clientA.rpc("set_plan_item_selected", {
        chosen_selected: true,
        chosen_work_date: "2026-08-04",
        target_work_item_id: workItemId,
      });
      expect(error).toBeNull();
    }

    const { data: plan, error: planError } = await clientA
      .from("daily_plans")
      .select("id, status")
      .eq("work_date", "2026-08-04")
      .single();
    const { data: plannedItems } = await clientA
      .from("daily_plan_items")
      .select("id, work_item_id, position")
      .eq("daily_plan_id", plan!.id)
      .order("position");

    expect(planError).toBeNull();
    expect(plannedItems).toHaveLength(2);

    const { error: readyError } = await clientA.rpc(
      "update_daily_plan_details",
      {
        chosen_intention: "Finish the oldest request first.",
        chosen_mark_ready: true,
        chosen_work_date: "2026-08-04",
      },
    );
    expect(readyError).toBeNull();

    const { error: doneError } = await clientA.rpc("set_daily_plan_item_done", {
      chosen_done: true,
      target_daily_plan_item_id: plannedItems![0].id,
    });
    const { data: workLog } = await clientA
      .from("work_logs")
      .select("worked_on, outcome")
      .eq("daily_plan_item_id", plannedItems![0].id)
      .single();
    const { data: hiddenPlan } = await clientB
      .from("daily_plans")
      .select("id")
      .eq("id", plan!.id);

    expect(doneError).toBeNull();
    expect(workLog).toEqual({ worked_on: "2026-08-04", outcome: "done" });
    expect(hiddenPlan).toEqual([]);

    const { error: deferredOutcomeError } = await clientA.rpc(
      "apply_end_of_day_outcome",
      {
        chosen_deferred_date: "2026-08-05",
        chosen_outcome: "deferred",
        target_daily_plan_item_id: plannedItems![1].id,
      },
    );
    const { error: noteError } = await clientA.rpc("save_day_note", {
      chosen_body: "Waiting work was deliberately planned for tomorrow.",
      chosen_is_important: true,
      chosen_work_date: "2026-08-04",
    });
    const { error: nextReadyError } = await clientA.rpc(
      "update_daily_plan_details",
      {
        chosen_intention: "Continue the deferred work.",
        chosen_mark_ready: true,
        chosen_work_date: "2026-08-05",
      },
    );
    const { data: finishedNextDate, error: finishError } = await clientA.rpc(
      "finish_end_of_day",
      { chosen_work_date: "2026-08-04" },
    );
    const { data: closedPlan } = await clientA
      .from("daily_plans")
      .select("status, closed_at")
      .eq("id", plan!.id)
      .single();
    const { data: dayNote } = await clientA
      .from("day_notes")
      .select("body, is_important")
      .eq("work_date", "2026-08-04")
      .single();

    expect(deferredOutcomeError).toBeNull();
    expect(noteError).toBeNull();
    expect(nextReadyError).toBeNull();
    expect(finishError).toBeNull();
    expect(finishedNextDate).toBe("2026-08-05");
    expect(closedPlan?.status).toBe("closed");
    expect(closedPlan?.closed_at).toBeTruthy();
    expect(dayNote).toEqual({
      body: "Waiting work was deliberately planned for tomorrow.",
      is_important: true,
    });
  });
});

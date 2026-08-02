import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import { describe, expect, it } from "vitest";

import { workspaceBackupSchema } from "@/features/settings/workspace-backup";
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
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      localEnvironment.SUPABASE_SERVICE_ROLE_KEY;

    expect(url).toBeTruthy();
    expect(key).toBeTruthy();
    expect(serviceKey).toBeTruthy();

    const clientA = createClient<Database>(url!, key!, {
      auth: { persistSession: false },
    });
    const clientB = createClient<Database>(url!, key!, {
      auth: { persistSession: false },
    });
    const admin = createClient<Database>(url!, serviceKey!, {
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

    const { error: profileSettingsError } = await clientA.rpc(
      "update_profile_settings",
      { chosen_display_name: "North Haven A" },
    );
    const { error: scheduleSettingsError } = await clientA.rpc(
      "update_work_schedule_settings",
      {
        chosen_ends_at_local: "16:30",
        chosen_starts_at_local: "08:00",
        chosen_time_zone: "America/New_York",
        chosen_working_weekdays: [1, 2, 3, 4, 5],
      },
    );
    const { data: profileA } = await clientA
      .from("profiles")
      .select("display_name, time_zone")
      .single();
    const { data: scheduleA } = await clientA
      .from("work_schedules")
      .select("ends_at_local, time_zone, working_weekdays")
      .eq("workspace_id", workspacesA![0].id)
      .single();

    expect(profileSettingsError).toBeNull();
    expect(scheduleSettingsError).toBeNull();
    expect(profileA).toMatchObject({
      display_name: "North Haven A",
      time_zone: "America/New_York",
    });
    expect(scheduleA).toMatchObject({
      ends_at_local: "16:30:00",
      time_zone: "America/New_York",
      working_weekdays: [1, 2, 3, 4, 5],
    });

    const { error: invalidScheduleError } = await clientA.rpc(
      "update_work_schedule_settings",
      {
        chosen_ends_at_local: "17:00",
        chosen_starts_at_local: "08:00",
        chosen_time_zone: "Not/AZone",
        chosen_working_weekdays: [1, 2, 3, 4, 5],
      },
    );
    expect(invalidScheduleError).not.toBeNull();

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { data: allowed, error } = await clientA.rpc(
        "claim_report_export_slot",
      );
      expect(error).toBeNull();
      expect(allowed).toBe(true);
    }
    const { data: limited, error: limitError } = await clientA.rpc(
      "claim_report_export_slot",
    );
    const { data: otherUserAllowed, error: otherUserLimitError } =
      await clientB.rpc("claim_report_export_slot");
    expect(limitError).toBeNull();
    expect(limited).toBe(false);
    expect(otherUserLimitError).toBeNull();
    expect(otherUserAllowed).toBe(true);

    const { error: protectedCalendarReadError } = await clientA
      .from("calendar_connections")
      .select("id");
    expect(protectedCalendarReadError).not.toBeNull();

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

    const { error: quickUpdateError } = await clientA.rpc(
      "update_ticket_workflow",
      {
        chosen_operational_status: "resolved",
        chosen_system_priority: "high",
        chosen_tracking_state: "active",
        target_work_item_id: ticketId!,
      },
    );
    const { error: crossWorkspaceQuickUpdateError } = await clientB.rpc(
      "update_ticket_workflow",
      {
        chosen_operational_status: "resolved",
        chosen_system_priority: "low",
        chosen_tracking_state: "closed",
        target_work_item_id: ticketId!,
      },
    );
    const { data: quicklyUpdatedTicket } = await clientA
      .from("work_inventory_rows")
      .select(
        "system_priority, operational_status, tracking_state, resolved_at",
      )
      .eq("id", ticketId!)
      .single();

    expect(quickUpdateError).toBeNull();
    expect(crossWorkspaceQuickUpdateError).not.toBeNull();
    expect(quicklyUpdatedTicket).toMatchObject({
      operational_status: "resolved",
      system_priority: "high",
      tracking_state: "active",
    });
    expect(quicklyUpdatedTicket?.resolved_at).toBeTruthy();

    const { error: restoreWorkflowFixtureError } = await clientA.rpc(
      "update_ticket_workflow",
      {
        chosen_operational_status: "waiting_response",
        chosen_system_priority: "urgent",
        chosen_tracking_state: "watching",
        target_work_item_id: ticketId!,
      },
    );
    expect(restoreWorkflowFixtureError).toBeNull();

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

    const { data: previousFriday } = await clientA.rpc("previous_workday", {
      chosen_before_date: "2026-08-03",
    });
    expect(previousFriday).toBe("2026-07-31");

    const { data: foundTicketId } = await clientA.rpc("find_ticket_by_number", {
      chosen_ticket_number: " nh-101 ",
    });
    const { data: searchResultsA, error: searchErrorA } = await clientA.rpc(
      "global_work_search",
      { chosen_include_archived: false, chosen_query: "Request reviewed" },
    );
    const { data: searchResultsB, error: searchErrorB } = await clientB.rpc(
      "global_work_search",
      { chosen_include_archived: false, chosen_query: "Request reviewed" },
    );
    expect(foundTicketId).toBe(ticketId);
    expect(searchErrorA).toBeNull();
    expect(searchErrorB).toBeNull();
    expect(searchResultsA?.[0]).toMatchObject({
      id: ticketId,
      match_reason: "Notes",
    });
    expect(searchResultsB).toEqual([]);

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

    const { data: bulkPlanned, error: bulkPlanError } = await clientA.rpc(
      "bulk_add_work_items_to_plan",
      {
        chosen_work_date: "2026-08-04",
        target_work_item_ids: [ticketId!, taskId!],
      },
    );
    expect(bulkPlanError).toBeNull();
    expect(bulkPlanned).toBe(2);

    const { data: newFollowUpId } = await clientA.rpc("save_open_follow_up", {
      chosen_reason: "Confirm the downstream form update.",
      chosen_review_on: "2026-08-10",
      chosen_waiting_on: "Forms team",
      target_work_item_id: ticketId!,
    });
    const { data: reviewsUpdated, error: bulkReviewError } = await clientA.rpc(
      "bulk_set_follow_up_review",
      {
        chosen_review_on: "2026-08-20",
        target_work_item_ids: [ticketId!],
      },
    );
    const { data: updatedFollowUp } = await clientA
      .from("follow_ups")
      .select("review_on")
      .eq("id", newFollowUpId!)
      .single();
    expect(bulkReviewError).toBeNull();
    expect(reviewsUpdated).toBe(1);
    expect(updatedFollowUp?.review_on).toBe("2026-08-20");

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

    const { data: reportingA, error: reportingErrorA } = await clientA.rpc(
      "reporting_daily_metrics",
      {
        chosen_end_date: "2026-08-04",
        chosen_start_date: "2026-08-04",
      },
    );
    const { data: reportingB, error: reportingErrorB } = await clientB.rpc(
      "reporting_daily_metrics",
      {
        chosen_end_date: "2026-08-04",
        chosen_start_date: "2026-08-04",
      },
    );

    expect(reportingErrorA).toBeNull();
    expect(reportingErrorB).toBeNull();
    expect(reportingA?.[0]).toMatchObject({
      completed_items: 1,
      deferred_items: 1,
      has_important_note: true,
      planned_items: 2,
      tickets_worked: 1,
    });
    expect(reportingB?.[0]).toMatchObject({
      completed_items: 0,
      deferred_items: 0,
      has_important_note: false,
      planned_items: 0,
      tickets_worked: 0,
    });

    const { data: totalsA, error: totalsErrorA } = await clientA.rpc(
      "reporting_period_totals",
      {
        chosen_end_date: "2026-08-04",
        chosen_start_date: "2026-08-04",
      },
    );
    const { data: totalsB, error: totalsErrorB } = await clientB.rpc(
      "reporting_period_totals",
      {
        chosen_end_date: "2026-08-04",
        chosen_start_date: "2026-08-04",
      },
    );
    const { data: inventoryMetricsA, error: inventoryMetricsErrorA } =
      await clientA.rpc("reporting_inventory_metrics", {
        chosen_end_date: "2026-08-04",
        chosen_start_date: "2026-08-04",
      });
    const { data: inventoryMetricsB, error: inventoryMetricsErrorB } =
      await clientB.rpc("reporting_inventory_metrics", {
        chosen_end_date: "2026-08-04",
        chosen_start_date: "2026-08-04",
      });
    const { data: workStatusA, error: workStatusErrorA } = await clientA.rpc(
      "reporting_work_status_snapshot",
      { chosen_as_of_date: "2026-08-04" },
    );
    const { data: workStatusB, error: workStatusErrorB } = await clientB.rpc(
      "reporting_work_status_snapshot",
      { chosen_as_of_date: "2026-08-04" },
    );

    expect(totalsErrorA).toBeNull();
    expect(totalsErrorB).toBeNull();
    expect(inventoryMetricsErrorA).toBeNull();
    expect(inventoryMetricsErrorB).toBeNull();
    expect(workStatusErrorA).toBeNull();
    expect(workStatusErrorB).toBeNull();
    expect(totalsA?.[0]).toMatchObject({
      completed_items: 1,
      planned_items: 2,
      tickets_worked: 1,
    });
    expect(totalsB?.[0]).toMatchObject({
      completed_items: 0,
      planned_items: 0,
      tickets_worked: 0,
    });
    expect(inventoryMetricsA?.[0]).toMatchObject({
      active_tickets: 1,
      waiting_tickets: 1,
      watching_tickets: 1,
    });
    expect(inventoryMetricsB?.[0]).toMatchObject({
      active_tickets: 0,
      waiting_tickets: 0,
      watching_tickets: 0,
    });
    expect(workStatusA?.[0]).toMatchObject({
      active_work: 0,
      total_active: 1,
      waiting: 1,
      watching: 0,
    });
    expect(workStatusB?.[0]).toMatchObject({
      active_work: 0,
      total_active: 0,
      waiting: 0,
      watching: 0,
    });

    const { data: connection, error: connectionError } = await admin
      .from("calendar_connections")
      .insert({
        access_token_encrypted: "server-only-access",
        access_token_expires_at: "2026-08-01T12:00:00.000Z",
        account_label: "work@example.com",
        provider_account_id: "google-account-a",
        refresh_token_encrypted: "server-only-refresh",
        scopes: [
          "https://www.googleapis.com/auth/calendar.events.readonly",
          "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
        ],
        workspace_id: workspacesA![0].id,
      })
      .select("id")
      .single();
    expect(connectionError).toBeNull();

    const { data: externalCalendar, error: externalCalendarError } = await admin
      .from("external_calendars")
      .insert({
        calendar_connection_id: connection!.id,
        is_primary: true,
        is_selected: true,
        name: "Work",
        provider_calendar_id: "work@example.com",
        time_zone: "America/Guatemala",
        workspace_id: workspacesA![0].id,
      })
      .select("id")
      .single();
    expect(externalCalendarError).toBeNull();

    const { data: meeting, error: meetingError } = await admin
      .from("external_calendar_events")
      .insert({
        end_local_date: "2026-08-06",
        ends_at: "2026-08-06T16:00:00.000Z",
        event_type: "default",
        external_calendar_id: externalCalendar!.id,
        is_all_day: false,
        provider_event_id: "meeting-1",
        start_local_date: "2026-08-06",
        starts_at: "2026-08-06T15:00:00.000Z",
        title: "Weekly sync",
        workspace_id: workspacesA![0].id,
      })
      .select("id")
      .single();
    expect(meetingError).toBeNull();

    const { error: meetingOutcomeError } = await admin
      .from("meeting_outcomes")
      .insert({
        attendance_status: "attended",
        confirmed_at: "2026-08-06T17:00:00.000Z",
        external_calendar_event_id: meeting!.id,
        local_note: "Reviewed the weekly queue.",
        workspace_id: workspacesA![0].id,
      });
    expect(meetingOutcomeError).toBeNull();

    const { error: calendarOnlyPlanError } = await clientA.rpc(
      "update_daily_plan_details",
      {
        chosen_intention: "Attend the scheduled meeting.",
        chosen_mark_ready: true,
        chosen_work_date: "2026-08-06",
      },
    );
    const { error: otherWorkspaceCalendarPlanError } = await clientB.rpc(
      "update_daily_plan_details",
      {
        chosen_intention: "No meeting belongs to this workspace.",
        chosen_mark_ready: true,
        chosen_work_date: "2026-08-06",
      },
    );
    expect(calendarOnlyPlanError).toBeNull();
    expect(otherWorkspaceCalendarPlanError).not.toBeNull();

    const { error: protectedEventReadError } = await clientA
      .from("external_calendar_events")
      .select("title");
    expect(protectedEventReadError).not.toBeNull();

    const { error: googleOooError } = await admin
      .from("non_working_days")
      .insert({
        allows_urgent_work: true,
        kind: "out_of_office",
        source: "google",
        source_event_id: externalCalendar!.id + ":ooo-1",
        work_date: "2026-08-10",
        workspace_id: workspacesA![0].id,
      });
    const { data: afterOooWorkday } = await clientA.rpc("next_workday", {
      chosen_after_date: "2026-08-07",
    });
    const { data: afterOooPlanningDate } = await clientA.rpc(
      "next_plannable_date",
      { chosen_after_date: "2026-08-07" },
    );
    const { data: beforeTuesdayPlanningDate } = await clientA.rpc(
      "previous_plannable_date",
      { chosen_before_date: "2026-08-11" },
    );
    expect(googleOooError).toBeNull();
    expect(afterOooWorkday).toBe("2026-08-11");
    expect(afterOooPlanningDate).toBe("2026-08-10");
    expect(beforeTuesdayPlanningDate).toBe("2026-08-10");

    const { data: savedDayAppearance, error: dayAppearanceError } =
      await clientA
        .from("calendar_day_appearances")
        .insert({
          color: "blush",
          work_date: "2026-08-10",
          workspace_id: workspacesA![0].id,
        })
        .select("id, color, work_date")
        .single();
    const { data: isolatedDayAppearances } = await clientB
      .from("calendar_day_appearances")
      .select("id")
      .eq("work_date", "2026-08-10");
    expect(dayAppearanceError).toBeNull();
    expect(savedDayAppearance).toMatchObject({
      color: "blush",
      work_date: "2026-08-10",
    });
    expect(isolatedDayAppearances).toEqual([]);

    const { error: oooPlanSelectionError } = await clientA.rpc(
      "set_plan_item_selected",
      {
        chosen_selected: true,
        chosen_work_date: "2026-08-10",
        target_work_item_id: taskId!,
      },
    );
    const { error: oooPlanReadyError } = await clientA.rpc(
      "update_daily_plan_details",
      {
        chosen_intention: "Keep the day intentionally light.",
        chosen_mark_ready: true,
        chosen_work_date: "2026-08-10",
      },
    );
    expect(oooPlanSelectionError).toBeNull();
    expect(oooPlanReadyError).toBeNull();

    const { data: backupData, error: backupError } = await clientA.rpc(
      "create_workspace_backup",
    );
    const backup = workspaceBackupSchema.safeParse(backupData);
    expect(backupError).toBeNull();
    expect(backup.success).toBe(true);
    if (!backup.success) throw new Error("Workspace backup was invalid.");
    expect(backup.data.security).toEqual({
      contains_authentication_secrets: false,
      google_credentials_included: false,
      provider_calendar_cache_included: false,
    });
    expect(backup.data.tables.work_items).toHaveLength(3);
    expect(backup.data.tables.calendar_outcomes).toHaveLength(1);

    const { error: changedProfileError } = await clientA.rpc(
      "update_profile_settings",
      { chosen_display_name: "Temporary replacement" },
    );
    const { data: archivedItems, error: archiveReminderError } =
      await clientA.rpc("bulk_archive_work_items", {
        target_work_item_ids: [reminderId!],
      });
    expect(changedProfileError).toBeNull();
    expect(archiveReminderError).toBeNull();
    expect(archivedItems).toBe(1);

    const { error: wrongConfirmationError } = await clientA.rpc(
      "restore_workspace_backup",
      {
        chosen_backup: backup.data,
        chosen_confirmation: "RESTORE",
      },
    );
    expect(wrongConfirmationError).not.toBeNull();

    const { data: restoreResult, error: restoreError } = await clientA.rpc(
      "restore_workspace_backup",
      {
        chosen_backup: backup.data,
        chosen_confirmation: "RESTORE NORTH HAVEN",
      },
    );
    expect(restoreError).toBeNull();
    expect(restoreResult).toMatchObject({
      calendar_day_appearances: 1,
      calendar_outcomes_applied: 1,
      calendar_outcomes_waiting: 0,
      daily_plans: 4,
      work_items: 3,
    });

    const [
      { data: restoredProfile },
      { data: restoredReminder },
      { data: restoredDayAppearance },
    ] = await Promise.all([
      clientA.from("profiles").select("display_name").single(),
      clientA
        .from("work_inventory_rows")
        .select("title, tracking_state")
        .eq("id", reminderId!)
        .single(),
      clientA
        .from("calendar_day_appearances")
        .select("color, work_date")
        .eq("work_date", "2026-08-10")
        .single(),
    ]);
    const { data: restoredMeetingOutcome } = await admin
      .from("meeting_outcomes")
      .select("attendance_status, local_note")
      .eq("external_calendar_event_id", meeting!.id)
      .single();
    const { data: preservedGoogleOoo } = await admin
      .from("non_working_days")
      .select("source")
      .eq("workspace_id", workspacesA![0].id)
      .eq("source_event_id", externalCalendar!.id + ":ooo-1")
      .single();
    expect(restoredProfile?.display_name).toBe("North Haven A");
    expect(restoredReminder).toEqual({
      title: "Check the form changes",
      tracking_state: "active",
    });
    expect(restoredDayAppearance).toEqual({
      color: "blush",
      work_date: "2026-08-10",
    });
    expect(restoredMeetingOutcome).toEqual({
      attendance_status: "attended",
      local_note: "Reviewed the weekly queue.",
    });
    expect(preservedGoogleOoo?.source).toBe("google");

    const { error: reopenError } = await clientA.rpc("reopen_closed_day", {
      chosen_work_date: "2026-08-04",
    });
    const { data: reopenedPlan } = await clientA
      .from("daily_plans")
      .select("status, closed_at, end_of_day_step")
      .eq("id", plan!.id)
      .single();
    expect(reopenError).toBeNull();
    expect(reopenedPlan).toEqual({
      closed_at: null,
      end_of_day_step: 2,
      status: "active",
    });

    const { error: recloseError } = await clientA.rpc("finish_end_of_day", {
      chosen_work_date: "2026-08-04",
    });
    expect(recloseError).toBeNull();

    const { error: archiveAfterRestoreError } = await clientA.rpc(
      "update_reminder",
      {
        chosen_description: "",
        chosen_remind_at: "2026-08-03T14:00:00.000Z",
        chosen_title: "Check the form changes",
        chosen_tracking_state: "archived",
        target_work_item_id: reminderId!,
      },
    );
    const { error: recoverArchivedError } = await clientA.rpc(
      "restore_archived_work_item",
      { target_work_item_id: reminderId! },
    );
    const { data: recoveredReminder } = await clientA
      .from("work_items")
      .select("tracking_state, archived_at")
      .eq("id", reminderId!)
      .single();
    expect(archiveAfterRestoreError).toBeNull();
    expect(recoverArchivedError).toBeNull();
    expect(recoveredReminder).toEqual({
      archived_at: null,
      tracking_state: "active",
    });
  });
});

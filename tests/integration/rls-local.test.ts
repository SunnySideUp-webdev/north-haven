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
  });
});

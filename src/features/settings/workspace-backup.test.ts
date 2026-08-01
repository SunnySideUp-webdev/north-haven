import { describe, expect, it } from "vitest";

import {
  restoreWorkspaceRequestSchema,
  workspaceBackupFilename,
  workspaceBackupSchema,
} from "@/features/settings/workspace-backup";

const backup = {
  exported_at: "2026-08-01T20:00:00Z",
  profile: { display_name: "Sunny", time_zone: "America/Guatemala" },
  schema: "north-haven.workspace-backup",
  security: {
    contains_authentication_secrets: false,
    google_credentials_included: false,
    provider_calendar_cache_included: false,
  },
  source_workspace_id: "11111111-1111-4111-8111-111111111111",
  tables: {
    calendar_outcomes: [],
    daily_plan_items: [],
    daily_plans: [],
    day_notes: [],
    follow_ups: [],
    month_notes: [],
    non_working_days: [],
    reminder_details: [],
    status_events: [],
    task_details: [],
    ticket_details: [],
    ticket_types: [],
    work_item_notes: [],
    work_items: [],
    work_logs: [],
  },
  version: 1,
  work_schedule: {
    ends_at_local: "17:00:00",
    starts_at_local: "08:00:00",
    time_zone: "America/Guatemala",
    working_weekdays: [1, 2, 3, 4, 5],
  },
  workspace: { name: "North Haven" },
};

describe("workspace backup contract", () => {
  it("accepts the versioned secret-free backup and creates a stable filename", () => {
    expect(workspaceBackupSchema.safeParse(backup).success).toBe(true);
    expect(workspaceBackupFilename(backup.exported_at)).toBe(
      "north-haven-workspace-2026-08-01.json",
    );
  });

  it("requires the exact destructive restore confirmation", () => {
    expect(
      restoreWorkspaceRequestSchema.safeParse({
        backup,
        confirmation: "RESTORE NORTH HAVEN",
      }).success,
    ).toBe(true);
    expect(
      restoreWorkspaceRequestSchema.safeParse({
        backup,
        confirmation: "RESTORE",
      }).success,
    ).toBe(false);
  });

  it("rejects backups that claim to contain OAuth secrets", () => {
    expect(
      workspaceBackupSchema.safeParse({
        ...backup,
        security: {
          ...backup.security,
          google_credentials_included: true,
        },
      }).success,
    ).toBe(false);
  });
});

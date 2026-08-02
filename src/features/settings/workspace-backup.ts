import { z } from "zod";

const backupRowSchema = z.record(z.string(), z.json());
const backupRowsSchema = z.array(backupRowSchema).max(25_000);

export const workspaceBackupSchema = z.object({
  exported_at: z.string(),
  profile: z.object({
    display_name: z.string(),
    time_zone: z.string(),
  }),
  schema: z.literal("north-haven.workspace-backup"),
  security: z.object({
    contains_authentication_secrets: z.literal(false),
    google_credentials_included: z.literal(false),
    provider_calendar_cache_included: z.literal(false),
  }),
  source_workspace_id: z.string().uuid(),
  tables: z.object({
    calendar_day_appearances: backupRowsSchema.default([]),
    calendar_outcomes: backupRowsSchema,
    daily_plan_items: backupRowsSchema,
    daily_plans: backupRowsSchema,
    day_notes: backupRowsSchema,
    follow_ups: backupRowsSchema,
    month_notes: backupRowsSchema,
    non_working_days: backupRowsSchema,
    reminder_details: backupRowsSchema,
    status_events: backupRowsSchema,
    task_details: backupRowsSchema,
    ticket_details: backupRowsSchema,
    ticket_types: backupRowsSchema,
    work_item_notes: backupRowsSchema,
    work_items: backupRowsSchema,
    work_logs: backupRowsSchema,
  }),
  version: z.literal(1),
  work_schedule: z.object({
    ends_at_local: z.string(),
    starts_at_local: z.string(),
    time_zone: z.string(),
    working_weekdays: z.array(z.number().int().min(1).max(7)).min(1).max(7),
  }),
  workspace: z.object({ name: z.string() }),
});

export const restoreWorkspaceRequestSchema = z.object({
  backup: workspaceBackupSchema,
  confirmation: z.literal("RESTORE NORTH HAVEN"),
});

export type WorkspaceBackup = z.infer<typeof workspaceBackupSchema>;

export function workspaceBackupFilename(exportedAt: string) {
  const date = /^\d{4}-\d{2}-\d{2}/.exec(exportedAt)?.[0] ?? "backup";
  return `north-haven-workspace-${date}.json`;
}

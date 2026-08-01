# Data model

## Modeling approach

Use a shared `work_items` table for plan-eligible objects and one-to-one detail
tables for kind-specific data. This gives `daily_plan_items` a real foreign key
instead of a weak polymorphic reference.

Every business record belongs to a workspace. The MVP has one member, but the
workspace boundary avoids a future authorization migration.

## Core entities

### profiles

- `id`
- `display_name`
- `time_zone`
- `created_at`
- `updated_at`

### workspaces

- `id`
- `name`
- `created_at`
- `updated_at`

### workspace_members

- `workspace_id`
- `profile_id`
- `role`
- `created_at`

### work_schedules

- `workspace_id`
- `working_weekdays`
- `starts_at_local`
- `ends_at_local`
- `time_zone`

### work_items

- `id`
- `workspace_id`
- `kind`: ticket, task, reminder, local_meeting
- `title`
- `description`
- `tracking_state`: active, watching, closed, archived
- `due_at`
- `created_at`
- `updated_at`
- `archived_at`

### ticket_details

- `work_item_id`
- `ticket_number`
- `ticket_type_id`
- `system_priority`: urgent, high, medium, low
- `operational_status`: pending, in_progress, waiting_response, resolved
- `received_at`
- `resolved_at`
- `closed_at`
- `form_backup_completed_at`
- `external_url`

Unique constraint: workspace plus normalized ticket number.

### ticket_types

- `id`
- `workspace_id`
- `name`
- `is_active`
- `sort_order`

Types are configurable and inactive values remain attached to historical data.

### task_details

- `work_item_id`
- `completed_at`

### reminder_details

- `work_item_id`
- `remind_at`
- `acknowledged_at`

### daily_plans

- `id`
- `workspace_id`
- `work_date`
- `status`: draft, ready, active, closed
- `intention`
- `closed_at`
- `created_at`
- `updated_at`

Unique constraint: workspace plus work date.

### daily_plan_items

- `id`
- `daily_plan_id`
- `work_item_id`
- `position`
- `execution_status`: planned, in_progress, done, returned, deferred, skipped
- `started_at`
- `completed_at`
- `outcome_note`
- `deferred_to_plan_id`

Unique constraint: daily plan plus work item.

### follow_ups

- `id`
- `workspace_id`
- `work_item_id`
- `state`: open, completed, cancelled
- `reason`
- `waiting_on`
- `started_at`
- `review_on`
- `completed_at`
- `created_at`
- `updated_at`

### work_logs

- `id`
- `workspace_id`
- `work_item_id`
- `daily_plan_item_id`, optional
- `worked_on`
- `started_at`, optional
- `ended_at`, optional
- `outcome`
- `created_at`

An automatic log is created when a planned ticket is started or receives a
confirmed End of Day outcome. Duplicate same-day automatic logs are prevented.

### work_item_notes

- `id`
- `workspace_id`
- `work_item_id`
- `body`
- `is_pinned`
- `created_by`
- `created_at`
- `updated_at`

### day_notes

- `id`
- `workspace_id`
- `work_date`
- `body`
- `is_important`
- `created_at`
- `updated_at`

### month_notes

- `id`
- `workspace_id`
- `month_start`, always the first local date of the month
- `body`
- `created_at`
- `updated_at`

### status_events

- `id`
- `workspace_id`
- `work_item_id`
- `status_dimension`: operational, tracking, execution
- `from_value`
- `to_value`
- `changed_by`
- `changed_at`

### calendar_connections

- `id`
- `workspace_id`
- `provider`: google
- `provider_account_id`
- `account_label`
- encrypted access/refresh token material or a provider-managed reference
- `scopes`
- `status`
- `last_synced_at`
- `last_error_code`
- `created_at`
- `updated_at`

Never expose token fields through client-facing database APIs.

### external_calendars

- `id`
- `calendar_connection_id`
- `provider_calendar_id`
- `name`
- `time_zone`
- `is_selected`
- `sync_token`, protected server-side
- `last_synced_at`

### external_calendar_events

- `id`
- `workspace_id`
- `external_calendar_id`
- `provider_event_id`
- `ical_uid`
- `title`
- `starts_at`
- `ends_at`
- `is_all_day`
- `event_type`: default, out_of_office, focus_time, other
- `status`
- `meeting_url`
- `provider_url`
- `provider_updated_at`
- `synced_at`

Do not store descriptions, attendee lists, or attachments in the MVP.

### meeting_outcomes

- `id`
- `workspace_id`
- `external_calendar_event_id`
- `attendance_status`: unconfirmed, probably_attended, attended, cancelled,
  did_not_attend, not_applicable
- `local_note`
- `confirmed_at`

### non_working_days

- `id`
- `workspace_id`
- `work_date`
- `kind`: out_of_office, holiday, manual
- `source`: google, manual
- `source_event_id`, optional
- `allows_urgent_work`

## Derived behavior

- `backup_done` is derived from `form_backup_completed_at IS NOT NULL`.

## Reporting projections

Reporting data remains derived rather than copied into analytics tables:

- `reporting_daily_metrics(start, end)` returns Calendar and trend rows.
- `reporting_period_totals(start, end)` returns exact-period distinct totals.
- `reporting_inventory_metrics(start, end)` reconstructs historical inventory
  and ticket-age snapshots from status events.
- `reporting_work_status_snapshot(date)` partitions active inventory into
  mutually exclusive Active, Watching, and Waiting segments for visualization.

All three functions derive the authenticated personal workspace internally and
limit ranges to 371 dates. Calendar, Insights, and Reports must consume these
same projections so a later export cannot silently redefine a metric.
- Ticket age is current date minus `received_at`, stopping at `closed_at` for
  historical reporting.
- A full-day OOO event creates non-working-day records for each covered local
  date. Both provider all-day records and exact local midnight-to-midnight
  intervals qualify; partial OOO events do not.
- Plan completion excludes synced meetings until attendance is confirmed and
  excludes cancelled/not-applicable meetings from the denominator.
- Calendar `worked` counts distinct tickets with a work log on that date.
- Resolved and Closed counts come from status events, supporting reopen history.
- Daily, Weekly, and Monthly reports use the same reporting projections as
  Insights and Calendar; they do not maintain independent counters.

## Reporting projections

Reporting is read-only and derived from `daily_plans`, `daily_plan_items`,
`work_logs`, `status_events`, `meeting_outcomes`, and follow-up history. The
protected `reporting_daily_metrics` function now provides the canonical daily
rows for Calendar, Insights, and reports. Weekly and monthly outputs aggregate
those same rows rather than maintaining independent counters.

No persistent `reports` or `report_files` table is required in the MVP. The
Report Builder sends a validated, server-side request containing only period,
date range, format, and inclusion flags. Generated PDF and CSV bytes are
streamed to the authenticated user and discarded after the response.

`report_export_attempts` stores only authenticated profile ID and request time
for the durable six-per-minute generation limit. It has RLS enabled, grants no
direct table access, stores no report configuration or content, and is mutated
only through `claim_report_export_slot()`.

## Data integrity rules

- Business tables require `workspace_id` and row-level authorization.
- Timestamps are stored in UTC; work dates are stored as local dates.
- Ticket number normalization trims whitespace and supports case-insensitive
  uniqueness.
- Notes and customer content are never placed in URL parameters.
- Hard deletion is restricted; normal user deletion archives records.
- KPI snapshots are not stored in the MVP. Queries or protected database views
  derive them from source events.

## Indexing plan

- Work items by workspace and tracking state
- Tickets by normalized number
- Tickets by operational status, priority, and received date
- Follow-ups by workspace, state, and review date
- Daily plans by workspace and work date
- Work logs by workspace, worked date, and work item
- Calendar events by calendar and start/end range
- Full-text search vector over ticket number, title, type, and authorized notes

# Work Inventory implementation

Status: Complete through Phase 7.5C plus permanent delete
Last updated: August 3, 2026

## Outcome

North Haven now persists real work inventory in local Supabase. Tickets, Tasks,
and Reminders remain distinct product concepts while sharing the lifecycle and
planning-ready fields that belong in a single inventory.

## Database implementation

Migration `20260731000300_work_inventory.sql` adds:

- `work_items` as the shared identity and tracking lifecycle
- one-to-one `ticket_details`, `task_details`, and `reminder_details`
- configurable `ticket_types` seeded with Change, Form, Content, and Other
- operational Ticket status separate from tracking state
- form-backup completion timestamps
- appendable work-item notes
- generic follow-ups with waiting-on and review-date context
- immutable status events for tracking, operational status, and backup changes
- a security-invoker `work_inventory_rows` read model
- transactional PostgreSQL functions for create and update operations
- per-workspace duplicate Ticket-number protection after trim and case
  normalization
- RLS policies on every exposed business table

Composite foreign keys enforce both workspace ownership and subtype correctness.
A Ticket detail cannot be attached to another workspace or to a Task identity.

## Application implementation

The `/work` route is no longer a placeholder. It provides:

- saved views for Active, Waiting for Response, Watching, Missing Backup,
  Closed, and All Work
- local search by Ticket number, title, or Ticket type without placing private
  content in the URL
- work-type filtering
- a calm table-based inventory rather than a card wall
- independent entry points for Tickets, Tasks, and Reminders

Create and edit flows use authenticated Server Actions and Zod validation.
Customer-entered descriptions and notes are not emitted to URLs or intentional
application logs. Reminder and Task date-times are converted to UTC instants in
the browser before persistence.
Ticket creation also supports local Tracking Tickets: checking Tracking ticket
under Ticket number removes the source-number requirement while keeping the rest
of the Ticket fields and workflow behavior unchanged.

The detail route provides overview data, the secure source-system link, activity
notes, an editable open follow-up, and automatic status history. Tracking can be
changed to Active, Watching, Closed, or Archived from Edit.

The final interaction increment adds:

- Ticket Type creation, renaming, activation/deactivation, and ordering in
  Settings
- case-insensitive duplicate protection and a requirement to retain one active
  Ticket Type
- completion and cancellation of open follow-ups with historical retention
- global `Ctrl/Command + K` Quick Add for Ticket, Task, or Reminder
- `/` to focus inventory search and `Ctrl/Command + Enter` to save entry forms
- autofocus and visible shortcut guidance for keyboard-efficient capture

Phase 7.5C completes the approved operational surface with:

- an Active default that includes both Active and Watching work
- session-persistent work type, priority, operational, and tracking filters
- exact ticket-number ranking ahead of partial search matches
- the complete operational table context: received date, age, priority,
  operational status, tracking state, next review, backup, and last worked date
- multi-selection with Add to Plan, Set Review Date, and recoverable Archive
- per-row permanent Delete from Work Inventory, exposed as an icon-only trash
  action with browser confirmation for records entered by mistake or work that
  no longer exists
- database guards that prevent archiving work still present in an open plan
- direct Add to Plan and Days Worked sections on Work Detail
- confirmations for downstream closure, archival, future received dates, and
  clearing an existing backup completion
- duplicate capture recovery with a direct Open Existing action
- private Global Search across number, title, type, notes, and secure link

Permanent Delete is intentionally separate from Archive. Archive remains the
recoverable lifecycle state for normal work cleanup; Delete removes the
underlying Ticket, Task, or Reminder and its dependent local records from North
Haven after confirmation.

## Security and verification

Validated on the Docker-backed local stack:

- clean replay of every migration
- generated TypeScript types from the resulting database
- two authenticated users cannot read or update each other's workspace data
- normalized duplicate Ticket numbers are rejected
- operational, tracking, and backup events are recorded
- Ticket, Task, and Reminder identities remain distinct
- account setup, session restoration, Task creation, editing, closing, and
  saved-view discovery pass in Chromium
- formatting, linting, strict TypeScript, unit tests, integration tests, and the
  production build pass

## Remaining scale and deployment hardening

The owner-facing Phase 4 interaction flow is complete. Two hardening tasks remain:

1. Add pagination or cursor loading before inventories exceed the current
   initial 500-row read boundary.
2. Perform the hosted-development and recovery hardening that remains from
   Phase 3 before production deployment.

The next product phase is Phase 5 Daily Planning: persisted daily plans,
deliberate selection, capacity guidance, authenticated Today, and the four-step
End of Day flow. Pagination can be introduced before the inventory approaches
its current 500-item boundary and does not block the user's present 35-item
workflow.

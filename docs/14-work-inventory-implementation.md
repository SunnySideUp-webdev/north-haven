# Work Inventory implementation

Status: First vertical slice complete  
Last updated: July 31, 2026

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

The detail route provides overview data, the secure source-system link, activity
notes, an editable open follow-up, and automatic status history. Tracking can be
changed to Active, Watching, Closed, or Archived from Edit.

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

## Remaining Phase 4 work

Before declaring all Phase 4 exit criteria complete:

1. Add Ticket-type management in Settings, including deactivate and reorder.
2. Add keyboard-efficient quick entry and verify the interaction states with a
   focused accessibility pass.
3. Add follow-up completion/cancellation instead of only open-follow-up editing.
4. Add pagination or cursor loading before inventories exceed the current
   initial 500-row read boundary.
5. Perform the hosted-development and recovery hardening that remains from
   Phase 3 before production deployment.

After the first three items, begin Phase 5 Daily Planning: persisted daily
plans, deliberate selection, capacity guidance, authenticated Today, and the
four-step End of Day flow.

# Recovery and lifecycle implementation

Status: Phase 7.5B complete
Last updated: August 1, 2026

## Outcome

North Haven now provides user-operated recovery before deployment. Data and
privacy can download a complete copy of user-owned workspace source data and
restore that copy transactionally. Closed days and archived work also have
visible, confirmed paths back into an editable state.

## Workspace backup contract

`GET /api/workspace-backup` authenticates the request, enforces same-origin
access, calls `create_workspace_backup()`, validates the result, and streams a
private, no-store JSON attachment. The contract is identified by:

- schema `north-haven.workspace-backup`
- version `1`
- export timestamp and source workspace ID
- an explicit security manifest

It contains Profile and Work schedule settings, Ticket Types, Tickets, Tasks,
Reminders, notes, follow-ups, status history, Daily Plans and items, work logs,
day and month notes, calendar day colors, manual non-working days, and confirmed
meeting outcomes.

It never contains a password, Supabase session, Google OAuth token, sync token,
or provider calendar cache. These are authentication or reproducible integration
state rather than portable workspace content.

## Transactional restoration

`POST /api/workspace-backup` accepts at most 10 MB, validates the complete
versioned shape, requires the exact phrase `RESTORE NORTH HAVEN`, and calls
`restore_workspace_backup()` as the authenticated owner. The UI additionally
requires a separate replacement acknowledgement.

PostgreSQL locks the personal workspace, removes only user-owned restore scope,
and rebuilds every related table inside one transaction. IDs and historical
timestamps are retained; actor IDs and workspace ownership are remapped to the
current authenticated owner. Any invalid constraint, enum, time zone, foreign
key, or row rolls back the entire request, leaving the current workspace
unchanged.

The current Google connection and synced provider cache are preserved. Meeting
outcomes are reapplied by provider calendar/event identity. Unmatched outcomes
remain in the protected `calendar_outcome_recovery` queue and are applied after
a later successful Google sync.

## Closed-day recovery

A closed End of Day screen now shows Planned, Completed, and Moved or returned
totals plus the saved day note. `Reopen this day` requires a second confirmation
and calls `reopen_closed_day()`, which returns the plan to Active at the Close
Today step without deleting outcomes, notes, logs, or history. Corrected
deferred/watching/skipped outcomes clean up their prior reversible side effects
before the day is closed again.

## Archived-work recovery

Work Inventory now has a dedicated Archived view. Opening an archived item
shows `Restore to Active`; the protected function verifies workspace ownership
and only accepts an item that is currently archived. The normal tracking-event
trigger records the recovery.

## Demonstrated recovery

The local integration test creates a related workspace graph, including a
closed plan, logs, notes, a saved calendar day color, a Google meeting outcome,
manual non-working time, and Google OOO. It then:

1. creates and validates a secret-free backup;
2. changes profile and work-item data;
3. proves an incorrect confirmation is rejected;
4. restores the backup;
5. verifies content, history, day color, meeting outcome, and Google OOO
   integrity;
6. reopens and closes a day again; and
7. archives and restores a work item.

The authenticated Chromium flow also downloads and restores a real backup,
uses the Archived view, and confirms the closed-day reopen experience.

## Remaining boundary

Account deletion is not part of Phase 7.5B. It is irreversible identity
lifecycle work and needs a separate, explicitly approved retention decision.
Phase 7.5C continues with Plan, Work, and End of Day parity.

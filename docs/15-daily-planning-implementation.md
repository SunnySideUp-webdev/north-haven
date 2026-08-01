# Daily Planning implementation

Status: First persistent vertical slice complete
Last updated: July 31, 2026

## Outcome

North Haven now persists a deliberate plan for a specific work date. The owner
can select work manually, order it without drag-and-drop, mark the plan Ready,
open Today, and record completion without changing a Ticket's operational or
tracking status.

## Database implementation

Migration `20260731000500_daily_planning.sql` adds:

- one `daily_plans` record per workspace and work date
- ordered, duplicate-safe `daily_plan_items`
- Draft, Ready, Active, and Closed plan states
- Planned, In Progress, Done, Returned, Deferred, and Skipped execution states
- automatic `work_logs` when planned work is completed
- `day_notes` for future Calendar and reporting use
- `non_working_days` for manual, holiday, and Google OOO dates
- a next-workday function using the authenticated work schedule and exclusions
- RLS on every new business table and authenticated transactional functions

The next-workday calculation skips weekends and recorded non-working dates. It
is ready to consume official Google OOO records when Calendar sync is built.

## Application implementation

Plan now provides:

- a safe date selector
- manual add/remove selection from active or watching inventory
- suggested ordering by priority and age
- explicit up/down position controls
- daily intention
- non-blocking capacity guidance beginning at nine actionable items
- Draft autosave after selection or ordering changes
- Mark Ready validation requiring at least one item

Today now reads only the selected plan for the user's local date. It provides a
real empty state, hides unplanned inventory, separates Tickets from normal work,
shows progress, and records reversible Done decisions without changing Ticket
workflow status.

The Work search regression reported during review is fixed. The `/` hint now
sits inside the search field and no longer overlaps the `All types` selector.

## Verification

- clean migration replay from an empty local database
- Friday-to-Monday next-workday calculation
- manual holiday correctly moves Monday to Tuesday
- duplicate plan selection is prevented by the database
- plans and work logs remain isolated across workspaces
- Mark Ready and completion create the expected persisted states
- Chromium covers Work creation, Plan selection, Ready confirmation, Today, and
  completion

## Next increment within Phase 5

Build the four-step End of Day flow on this foundation:

1. Update Tickets
2. Close Today with an explicit outcome for every planned item
3. Review due follow-ups
4. Prepare and mark the calculated next workday Ready

That increment will also add day-note autosave, explicit deferral, Return to
Inventory, Keep Watching, and the calm End of Day completion state.

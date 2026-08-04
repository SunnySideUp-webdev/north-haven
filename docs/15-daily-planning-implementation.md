# Daily Planning implementation

Status: Complete through Phase 7.5C plus cross-day planning de-duplication
Last updated: August 2, 2026

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
- cross-day planning de-duplication: work already selected in another open
  plan is hidden from available and Unplanned lists until that plan is closed
  or the work is removed/resolved through an outcome
- suggested ordering by priority and age
- explicit up/down position controls
- daily intention
- non-blocking capacity guidance beginning at nine actionable items
- Draft autosave after selection or ordering changes
- Mark Ready validation requiring at least one item
- previous and next planning-date navigation that respects the work schedule,
  includes OOO weekdays, and skips holidays or manually blocked dates
- visible work schedule, meeting count, due follow-ups, and current plan state
- Suggested, Urgent, Oldest, Waiting, Watching, and Unplanned saved filters
- additional type, ticket type, priority, operational, tracking, backup,
  received-date, and review-date filters retained for the browser session
- Suggested, Oldest, Newest, Priority, and Recently Worked ordering

The same availability rule is used by the embedded End of Day next-workday
planner because both surfaces read through `getDailyPlanningData`. Server
actions also guard against stale clients adding work that is already selected
in another non-closed plan, returning a clear duplicate-planning message rather
than silently creating a confusing second commitment.

Today now reads only the selected plan for the user's local date. It provides a
real empty state, hides unplanned inventory, separates Tickets from normal work,
shows progress, and records reversible Done decisions without changing Ticket
workflow status. Planned work rows in Today now match the Work Inventory's
hover-open rhythm: the item content opens Work Detail without a separate
Details action, and Work Detail returns to Today when it was opened from Today.
The Today overview rail also loads and saves the private day note plus its
Important marker, reusing the same persisted `day_notes` record consumed by End
of Day, Calendar, and report exports.

The Work search regression reported during review is fixed. The `/` hint now
sits inside the search field and no longer overlaps the `All types` selector.

## Verification

- clean migration replay from an empty local database
- Friday-to-Monday next-workday calculation
- manual holiday correctly moves Monday to Tuesday
- duplicate plan selection is prevented by the database
- cross-day duplicate planning is filtered before rendering and guarded in the
  selection action
- plans and work logs remain isolated across workspaces
- Mark Ready and completion create the expected persisted states
- Chromium covers Work creation, Plan selection, Ready confirmation, Today, and
  completion

## End of Day implementation

The four-step End of Day flow is now implemented:

1. Update Tickets
2. Close Today with an explicit outcome for every planned item
3. Review due follow-ups
4. Prepare and mark the calculated next workday Ready

Each planned item requires an explicit outcome: Done, Return to Inventory, Plan
for Another Date, Keep Watching, or No Longer Needed. Deferral requires a future
date and creates the new selection transactionally. Nothing rolls over by
default.

Due follow-ups can remain waiting with a future review date, return a work item
to Active, close it after an external change, or become no longer relevant.
Day notes and their important marker can be edited from Today or End of Day and
persist for Calendar and reporting.

Finish End of Day is transactional and remains unavailable until:

- every actionable plan item has an outcome
- every due follow-up has a decision
- the calculated next workday has a Ready plan

The completion state confirms `Your next workday is ready.` without scores,
confetti, or gamification.

Phase 7.5C keeps the owner inside End of Day for the full ritual. Ticket capture
now supports Save Ticket, Save and Add Another, and Save and Add to Next Day.
The final step embeds next-workday selection and Ready confirmation instead of
requiring a separate Plan round trip. The closed summary includes the first
focus item and first meeting for the next workday.

## Next product phase

Phase 6 has added meetings and official OOO context to Plan, Today, Calendar,
and End of Day without making Calendar a dependency for manual planning. The
implementation and completed live corporate OAuth feasibility check are
documented in `docs/16-google-calendar-implementation.md`.

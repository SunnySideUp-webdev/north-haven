# Operational parity implementation

Status: Phase 7.5C complete
Last updated: August 1, 2026

## Outcome

Plan, Work, Work Detail, and End of Day now match the approved daily operating
model closely enough to begin production-like authenticated coverage. The
increment improves control over a large inventory without adding dashboard
noise or turning North Haven into a ticket system.

## Plan

Plan now supports previous and next workday navigation using the configured
schedule and recorded non-working dates. Its context panel shows the workday
hours, plan state, selected count, due follow-ups, and meetings.

The owner can use Suggested, Urgent, Oldest, Waiting, Watching, and Unplanned
views, then refine by work kind, ticket type, priority, operational status,
tracking state, backup state, received date, and follow-up review date. Sorting
supports Suggested, Oldest, Newest, Priority, and Recently Worked. Filter
choices remain in browser session storage and contain no customer content.

## Work and detail

The Work table now exposes received date, age, priority, operational status,
tracking state, next review, backup, and last worked date. Active includes both
Active and Watching work. Exact ticket numbers rank ahead of partial matches.

Multi-selection supports:

- adding selected work to an explicit plan date
- moving the review date of selected open follow-ups
- confirmed, recoverable archival

The database rejects archival when an item remains Planned or In Progress in an
open daily plan. It also derives every workspace from the authenticated user and
retains the existing RLS boundary.

Work Detail adds direct date-based planning and a Days Worked record. Edit asks
for explicit confirmation before downstream closure, archival, a future
received date, or clearing an existing backup completion. Duplicate ticket
capture offers a direct link to the existing record.

## End of Day

Ticket capture entered from End of Day now offers Save Ticket, Save and Add
Another, and Save and Add to Next Day. The final step embeds the next workday's
selection and Ready action. A full Plan link remains available for deeper
filtering and ordering, but the normal ritual no longer requires leaving the
flow.

The closed summary retains calm totals and adds the next first focus and first
meeting.

## Global Search and meeting scope

Global Search is included in the personal launch. It opens over the current
screen and searches ticket number, title, ticket type, notes, and secure
external link through a same-origin authenticated POST request. Queries do not
enter the browser URL, responses are private/no-store, exact ticket numbers rank
first, and archived items are excluded by default.

Manual meeting entry is deferred. The live read-only corporate Google Calendar
connection is already verified and remains the single meeting source, avoiding
duplicates and ambiguous attendance history. A stale or disconnected calendar
does not block Tickets, Tasks, Reminders, Plan, Today, or End of Day.

## Database migration

Migration `20260801001700_operational_completeness.sql` adds:

- `previous_workday`
- `last_worked_on` on `work_inventory_rows`
- authenticated bulk plan, review-date, and archive functions
- duplicate ticket lookup
- workspace-isolated Global Search

## Verification

- migration applied successfully to the Docker-backed local database
- regenerated TypeScript database contract
- formatting, ESLint, strict TypeScript, unit tests, and production build pass
- local two-user integration verifies previous workday, private search, bulk
  planning, bulk review changes, guarded archival, and existing recovery flows
- Chromium verifies confirmations, Global Search, embedded next-day planning,
  End of Day closure, and the broader authenticated workflow

## Next step

Phase 7.5D moves the same critical workflows into a hosted development Supabase
environment and expands production-like browser coverage. It does not authorize
replacing or reconfiguring the owner's existing Netlify deployment.

# UX specification

## Global interaction rules

- All meaningful changes show Saved, Saving, or Could not save feedback.
- Autosave is used for notes and End of Day progress; explicit submit actions
  are used for creating records and destructive changes.
- Focus returns to a predictable control after dialogs close.
- Keyboard users can complete ticket entry and day planning without a mouse.
- Color is never the only indicator of status.
- Destructive deletion requires confirmation; normal archival does not.
- Dates display in the workspace time zone and use English month/day labels.
- The interface does not use mascots or decorative icons in the MVP.

## Sign in

### Content

- North Haven wordmark
- Email
- Password or magic-link action, depending on the final authentication setup
- Forgot password
- Privacy notice

### Acceptance criteria

- An unauthenticated visitor cannot access product routes.
- Authentication errors do not reveal whether an unrelated email exists.
- On success, an incomplete profile goes to setup; a complete profile goes to
  Today.

## First-time setup

### Fields

- Display name
- Time zone, defaulting to the browser's detected zone
- Workdays, default Monday-Friday
- Workday start, default 8:00 AM
- Workday end, default 5:00 PM
- Calendar connection, optional to defer

### Validation

- At least one workday is required.
- End time must be later than start time.
- A valid IANA time zone is required.

## Today

### Purpose

Answer what to do now without exposing the full inventory.

### Header

- `Today`
- Full English date
- Plan state: Not planned, Draft, Ready, In progress, or Closed
- Optional daily intention

### Context rail

- Planned ticket count
- Meeting count
- Reminder count
- Progress as `n of m`
- Next meeting with `Open in Google Calendar`
- Waiting/Watching count and count due for review
- End of Day action after the configured afternoon threshold; always available
  from the overflow menu

### Main sections

1. Work Plan
2. Tasks and Reminders
3. Meetings

Each actionable row contains a completion control, title, compact metadata, and
a details action. Medium priority is visually quiet. Urgent and High are
explicitly labeled.

### Today states

- **No plan:** explain that nothing is planned and offer `Plan today` and
  `View work inventory`.
- **Ready:** display the approved order.
- **Closed:** display the completed summary and allow corrections through
  `Reopen day` with confirmation.
- **OOO:** display `You are out of office today` while keeping the standard
  `Plan this day` action available.
- **Calendar stale:** retain cached meetings and show the last successful sync.

### Acceptance criteria

- Unplanned tickets are absent from the main list.
- Completing an item updates progress without changing ticket workflow status.
- Opening a ticket and returning preserves scroll and keyboard position.
- Meetings are ordered by start time and display their time zone correctly.
- Progress excludes informational calendar items until attendance is confirmed.

## Plan a Day

### Header

- Date selector
- Previous and next workday actions
- Plan state
- `Mark ready` primary action

### Context rail

- Work schedule
- Synced meetings
- OOO coverage
- Follow-ups due
- Typical load of 6-8 actionable items

### Inventory controls

- Search by ticket number or title
- Saved filters: Suggested, Urgent, Oldest, Waiting, Watching, Unplanned
- Additional filters: type, priority, operational status, tracking state,
  received date, backup status, review date
- Sorts: Suggested, Oldest first, Newest first, Priority, Recently worked

### Selection behavior

- A checkbox adds or removes an item from the plan.
- The plan does not allow the same work item twice.
- Position controls move an item up or down; no drag-and-drop is required.
- Tasks and reminders can be created inline.
- Synced meetings appear automatically and are not manually selected.
- Selecting a date with a full-day OOO event keeps the normal planning controls
  available and requires no confirmation.

### Capacity warning

At nine actionable items, show:

> This plan has 9 items. Your usual day contains 6-8. You can keep this plan or
> remove something.

The warning never disables `Mark ready`.

### Acceptance criteria

- Marking Ready requires at least one actionable item or one meeting.
- A Draft plan autosaves after every selection and order change.
- Previous/Next in Plan includes OOO weekdays and skips holidays or manually
  blocked dates. End of Day continues to skip OOO when choosing its next
  required workday.
- Changing a Ready plan returns it to Draft until reconfirmed.

## End of Day

### Shared behavior

- Four-step progress indicator
- Autosave after each decision
- `Save and exit` at every step
- Resume at the last incomplete step
- Back navigation does not discard later completed decisions

### Step 1: Update tickets

Support a focused single-entry form and a keyboard-efficient batch mode.

#### Ticket fields

- Ticket number: required, trimmed, case-insensitive unique within workspace,
  maximum 80 characters
- Title: required, 1-200 characters
- Type: required, configurable value
- Received date: required, defaults to today
- System priority: required, defaults to Medium
- Operational status: required, defaults to Pending
- Notes: optional, maximum 10,000 characters
- Form backup: checkbox represented internally by a completion timestamp
- External link: optional valid HTTPS URL

#### Actions

- `Save and add another`
- `Save and add to next workday`
- `Save ticket`
- `Cancel`

#### Validation behavior

- Duplicate ticket numbers offer `Open existing ticket`; they are never silently
  merged.
- Received date may be in the past but not in the future without explicit
  confirmation.
- Invalid links do not block saving the rest of the draft until submit.

### Step 2: Close today

Each planned item requires one outcome:

- Done
- Return to inventory
- Plan for another date
- Keep watching
- No longer needed

Operational ticket status changes are separate and optional.

Meetings default to `Probably attended` after their end time. The user confirms:

- Attended
- Cancelled
- Did not attend
- Not applicable

### Step 3: Review follow-ups

Show due and overdue items first. Each can be:

- Still waiting, with a new review date
- Response received, returning the ticket to Active
- External change completed, closing the ticket
- No longer relevant, archiving the follow-up

### Step 4: Plan next workday

Embed the Plan a Day interaction for the calculated next workday. New tickets
created in Step 1 are immediately searchable.

### Completion state

Show only the next date and compact totals:

> Your next workday is ready.

Provide `Return to Today` and `Close North Haven`-style completion language,
without attempting to close the browser window.

### Acceptance criteria

- End of Day cannot finish while a planned actionable item lacks an outcome.
- A meeting can remain Unconfirmed, but the confirmation screen shows the count.
- Unfinished items never move dates without an explicit decision.
- Finishing closes the current Daily Plan and marks the next plan Ready.

## Work inventory

### Default view

Active and Watching items in a calm data table. Closed and Archived are excluded
unless selected.

### Saved views

- Active
- Waiting for Response
- Watching
- Missing Backup
- Closed
- All Work

### Columns

- Ticket number
- Title
- Type
- Received
- Age
- Priority
- Operational status
- Tracking state
- Next review
- Backup
- Last worked

Columns can be hidden, but the MVP does not require arbitrary reordering.

### Bulk actions

Limited to archive, set review date, and add to a selected day. Bulk deletion is
not available.

### Acceptance criteria

- Filters persist during the session.
- Exact ticket number search is ranked first.
- The table supports at least several thousand items with server-side paging.
- Archive is recoverable from the Archived filter.

## Ticket detail

### Header

- Ticket number and title
- Operational status
- Tracking state
- System priority
- `Add to plan`

### Sections

- Overview
- Notes
- Follow-up
- Activity history
- Days worked

### State transition rules

- Moving to Resolved sets `resolved_at` if empty.
- Moving away from Resolved does not delete its historical resolution event.
- Moving to Closed requires confirmation that downstream work is complete and
  sets `closed_at`.
- Closed tickets can be reopened; the event is recorded.
- Checking Form backup records the current timestamp; unchecking requires
  confirmation and records the correction.

### Acceptance criteria

- Every status transition creates history.
- Notes indicate author and timestamp.
- Customer content never appears in browser URLs or analytics events.

## Monthly Calendar

### Layout

- Lavender editorial page header
- Blush weekday headers
- Left context rail with Today, month/year controls, display filters, and monthly
  note
- Seven-column calendar grid; weekends are muted

### Day cell content

- Date
- Tickets worked
- Tickets resolved
- Meetings attended
- Important note indicator
- OOO label when applicable

Only non-zero metrics render.

### Day Summary panel

- Original plan
- Actual outcomes
- Tickets worked, resolved, and closed
- Meeting attendance
- Tasks completed
- Day note
- Deferred items

### Acceptance criteria

- Metrics use actual logs and confirmed outcomes.
- Changing months preserves enabled display filters.
- Full-day OOO cells do not display empty productivity metrics.
- Selecting a date does not navigate away from the month.

## Insights

### Periods

- Week
- Month
- Quarter
- Custom range

### Metrics

- Tickets worked
- Tickets resolved
- Tickets closed
- Active tickets
- Waiting for Response
- Watching
- Average daily worked tickets
- Plan completion rate
- Average active ticket age

### Charts

- Work completed by day
- Received versus resolved tickets
- Active inventory trend
- Ticket age distribution
- Weekly and monthly plan completion

Avoid a combined productivity score. Charts must allow comparison and include a
plain-text summary.

### Acceptance criteria

- Every metric has an accessible definition.
- The same date range produces consistent numbers across calendar and insights.
- A period with no data displays an explanation, not a zero-filled chart.

### Report entry point

- The Insights header includes `Export report` beside the period selector.
- The action opens the Report Builder without changing the selected Insights
  period when it can be represented as Daily, Weekly, or Monthly.
- Returning from the builder restores the prior Insights state.

## Reports

### Periods

- Daily
- Weekly
- Monthly

### Builder

- Period type and eligible date range
- Designed PDF or Data CSV format
- Live preview for PDF
- Summary metrics, trend chart, and status snapshot enabled by default
- Ticket numbers and titles, day notes, and follow-up reasons disabled by
  default
- `Generate PDF` or `Download CSV` primary action

### PDF content

- North Haven wordmark and `Private work summary`
- Period name, exact date range, workspace time zone, and generation time
- Worked, Resolved, Closed, and Plan Completion
- Period-appropriate trend chart and status snapshot
- Plain-language summary
- Optional detailed item list on additional pages

### Acceptance criteria

- Calendar, Insights, and Reports use identical metric definitions.
- The exact local date range is visible before generation.
- Reports with customer-sensitive details require explicit opt-in.
- The preview never exposes content that is not selected for the export.
- A generation failure preserves every builder selection.
- Exporting has no mutation effect on work records.
- Generated report files are not stored by North Haven in the MVP.

Detailed behavior is defined in `docs/12-reporting-and-exports.md`.

## Settings

### Sections

- Profile
- Work schedule
- Ticket types
- Calendar connection
- Data and privacy
- Security

### Calendar settings

- Connected account
- Selected calendars
- Last successful sync
- `Sync now`
- `Reconnect`
- `Disconnect`

Disconnecting revokes or invalidates stored access where supported and removes
server-held tokens. Cached events can be removed after confirmation.

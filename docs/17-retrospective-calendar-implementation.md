# Retrospective Calendar implementation

Status: Phase 7 Calendar and Day Summary increment complete
Last updated: August 1, 2026

## Outcome

Calendar is now a monthly view of planned and completed work rather than a
traditional agenda. It remains useful when Google Calendar is disconnected and
combines North Haven plans and outcomes with confirmed read-only meeting
attendance when the connection is available.

Selecting a date opens Day Summary over the current month without navigating
away. Month and year controls change the reporting period, while the display
filters remain client state and do not alter the underlying metrics.

## Shared reporting projection

Migration `20260801000800_reporting_calendar.sql` adds the protected
`reporting_daily_metrics(start, end)` function. It returns one workspace-local
row per date for ranges of at most 371 days and is the canonical source for
Calendar, the upcoming Insights views, and report exports.

The projection derives:

- distinct Tickets Worked from work logs
- Resolved and Closed from historical status events in the workspace time zone
- completed Tasks and Reminders from final work-log outcomes
- confirmed Meetings Attended from selected Google calendars
- planned, completed, returned, deferred, and skipped plan-item counts
- important Day Note state and note content
- full-local-day Google OOO state
- plan intention and historical plan status

The function accepts no workspace identifier. It derives the authenticated
personal workspace server-side, uses a fixed empty search path, and exposes
only the aggregate and local-note fields needed by the product. Calendar token,
event-title, and provider metadata remain inaccessible through the browser
database role.

## Monthly notes

The same migration adds `month_notes`, protected by RLS and keyed by workspace
plus the first date of the month. The Calendar rail can create, update, or clear
the note without placing its content in a URL.

Migration `20260801002200_calendar_day_appearance.sql` adds RLS-protected,
workspace-scoped day colors. Default removes the preference; Lavender, Blush,
Rose, Cream, and Sage persist across sessions and are included in workspace
backup and restore. The preference is visual only and never changes plan,
Calendar, OOO, or reporting data.

## Interface behavior

- fixed six-week, Sunday-first planner grid
- blush weekday header and muted adjacent-month/weekend cells
- non-zero Planned, Worked, Resolved, confirmed Meetings, and Important Note
  indicators
- planned-only dates display their count directly in the cell
- full-day OOO treatment with the soft `#DDD5E6` planner lavender, muted purple
  text, and no misleading zero-productivity metric
- hover-only three-dot menu for Default, Lavender, Blush, Rose, Cream, and Sage
- edge-aware appearance popovers that stay visible near the left, right, and
  bottom edges of the monthly grid
- explicit current date and selected-date states
- month/year selectors plus Previous and Next controls
- independent display filters for Planned, Worked, Resolved, Meetings, and Notes
- Day Summary with outcomes, Plan vs Actual, intention, deferred/returned counts,
  and the private day note
- editable monthly note with an explicit save state
- compact Google connection context that never blocks work history

## Verification

- live local migration applied without resetting personal data
- generated Supabase TypeScript contract updated
- real workspace projection returned the complete requested date range and
  recognized synchronized OOO dates
- unit coverage for month parsing, year boundaries, and the fixed 42-day grid
- component coverage for planned-only cells, soft OOO styling, edge-safe saved
  color selection, metrics, Day Summary, filters, and month navigation
- opt-in integration coverage asserts workspace isolation for the
  security-definer reporting projection
- TypeScript and ESLint pass

## Remaining Phase 7 work

1. Build the Daily, Weekly, and Monthly Report Builder in Insights.
2. Stream designed PDF and data-only CSV exports with privacy-safe defaults.

Week, Month, Quarter, and Custom Range Insights plus their accessible trend
charts are complete and documented in `docs/18-insights-implementation.md`.

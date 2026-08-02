# Insights implementation

Status: Phase 7 Insights increment complete
Last updated: August 1, 2026

## Outcome

Insights now turns North Haven's historical work record into calm, comparable
period summaries without assigning a productivity score. The interface supports
Week, Month, Quarter, and Custom ranges, keeps all labels and explanations in
English, and uses the approved lavender/blush visual language.

Current Week, Month, and Quarter ranges are partial through the workspace-local
current date. Completed periods use their complete natural boundary. Custom
ranges support up to 371 dates. The comparison period immediately precedes the
selected range and uses the same number of dates.

## Reporting functions

Migration `20260801000900_reporting_insights.sql` adds two authenticated,
workspace-derived reporting functions:

- `reporting_period_totals(start, end)` calculates exact-period distinct Tickets
  Worked plus Resolved, Closed, completed Tasks/Reminders, confirmed Meetings,
  and Plan Completion inputs.
- `reporting_inventory_metrics(start, end)` reconstructs one historical
  inventory snapshot per date with Tickets Received, Active, Waiting, Watching,
  average active age, and four ticket-age bands.

Migration `20260801001000_reporting_meeting_instances.sql` keeps recurring
meeting instances distinct by local date while still deduplicating the same
event if it appears through more than one selected calendar.

Migration `20260801001100_reporting_work_status.sql` adds an exact historical
snapshot for the status donut. Its Active, Watching, and Waiting categories are
mutually exclusive and always add up to the Active Tickets total shown in the
center.

Both functions accept ranges of at most 371 days, derive the personal workspace
from the authenticated session, use an empty search path, and accept no
workspace identifier from the browser. The daily Calendar projection remains
the source for date-level activity and plan trends.

Historical inventory uses the latest tracking and operational status event known
on each local date. A ticket closed today therefore remains visible in an older
period where it was still Active. `Waiting for Response` and `Watching` are
subsets of Active rather than additional inventory totals.

## Metric semantics

- **Tickets Worked:** distinct Tickets with at least one Work Log in the exact
  selected period. Chart bars show daily or grouped work activity, so a ticket
  touched on multiple dates can appear in more than one chart interval without
  inflating the headline distinct-period metric.
- **Resolved:** historical transitions into Resolved. Reopening does not erase a
  prior resolution.
- **Closed:** historical transitions into Closed after downstream work is
  confirmed.
- **Active:** Tickets whose historical tracking state is Active or Watching at
  period end.
- **Waiting for Response:** Active Tickets whose historical operational status
  is Waiting for Response at period end.
- **Watching:** Active Tickets intentionally retained for downstream follow-up at
  period end.
- **Average daily worked:** daily ticket activity divided by configured working
  dates in the selected period; weekends and full-day OOO dates are excluded
  from both numerator and denominator.
- **Plan Completion:** completed actionable plan items divided by eligible
  planned items. A missing denominator displays an em dash and explanation.
- **Average active age:** calendar days between Received date and the period-end
  snapshot for Active Tickets.

## Interface behavior

- Week, Month, Quarter, and Custom range controls use dates only in the URL.
- Current partial periods are labeled `Current period through today`.
- Five primary metrics are followed by a quieter status and average band.
- The primary analysis surface mirrors the approved high-fidelity direction:
  stacked Worked/Resolved bars on the left and a Work Status donut on the right.
- Stacked activity bars show the weekday or bucket label below each bar, then
  color-keyed Worked and Resolved totals below the label to avoid ambiguous
  paragraph summaries.
- Work Completed, Received versus Resolved, Active Inventory, Ticket Age, and
  Plan Completion charts include visible plain-language summaries.
- Every visual chart includes a semantic text or table alternative.
- An individual chart with no eligible data explains the absence instead of
  drawing misleading zero bars.
- Tasks, Reminders, and confirmed Meetings remain separate from ticket totals.
- `Export report` opens the implemented Report Builder and preserves Week or
  Month context without putting report settings in the URL. Quarter and Custom
  ranges open the Monthly report scale because those are not report formats.

## Local visual-review data

`supabase/demo/insights_demo.sql` creates 16 synthetic tickets plus July 2026
plans, work logs, outcomes, historical statuses, and three demo day notes. Every
record uses the `DEMO-INSIGHT-` or `[DEMO]` marker and contains no customer
information. Re-running the script is idempotent for these marked records.

`supabase/demo/remove_insights_demo.sql` removes only those marked synthetic
records. Neither script runs as part of normal migrations, CI, production setup,
or `supabase db reset`.

## Verification

- local migration applied without resetting personal data
- generated Supabase TypeScript contract updated
- database lint reports no public-schema errors
- live authenticated aggregate and inventory RPC shapes validated without
  exposing ticket content
- unit coverage for period boundaries, partial ranges, equal-duration
  comparisons, grouping, OOO-aware averages, and plan completion
- component coverage for metric definitions, chart alternatives, and safe period
  navigation
- opt-in two-user integration coverage extended for both new security-definer
  reporting functions

## Phase 7 completion

The Daily, Weekly, and Monthly Report Builder, designed PDF, data CSV, privacy
controls, and protected streaming endpoint are implemented. See
`docs/19-report-builder-implementation.md`.

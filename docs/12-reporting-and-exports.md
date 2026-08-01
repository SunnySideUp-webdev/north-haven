# Reporting and exports

Status: Implemented
Last updated: August 1, 2026

## Product role

Reports turn Insights into a portable daily, weekly, or monthly work summary.
They are not a separate analytics destination and do not add metrics to Today.
The entry point is `Export report` in Insights.

The primary output is a designed PDF that preserves North Haven's calm visual
identity. CSV is a secondary data-only format for personal analysis.

## Recommended experience

1. Open Insights and select `Export report`.
2. Choose Daily, Weekly, or Monthly.
3. Choose the eligible day, week, or month.
4. Review the automatically calculated metrics and preview.
5. Select the sections to include.
6. Generate a designed PDF or a data CSV.

Reports use completed historical data. They never change plans, tickets,
status, or Calendar events.

## Period rules

### Daily

- One local calendar date in the workspace time zone
- Tickets Worked, Resolved, Closed, and Plan Completion
- Tasks and reminders completed
- Meetings attended or confirmed
- Waiting/Watching follow-up decisions made
- Optional day note, excluded by default

### Weekly

- Monday through Friday by default, respecting the configured working week
- Summary metrics and work-completed-by-day chart
- End-of-week Active, Waiting for Response, and Watching counts
- Follow-up reviews due in the next workweek
- Plain-language pattern summary

### Monthly

- One calendar month in the workspace time zone
- Same core metrics as Insights
- Weekly rhythm and active-inventory trend
- Received versus Resolved totals
- End-of-month status snapshot
- Plain-language pattern summary

The user can export a completed period or the current partial period. Partial
reports are clearly labeled `Through {date}`.

## Content options

Enabled by default:

- Summary metrics
- Trend chart when the period has more than one working day
- Current or end-of-period work status
- Plain-language summary

Disabled by default:

- Ticket numbers and titles
- Day notes
- Follow-up reasons

When detailed work content is enabled, the preview displays `This report may
contain customer information.` before generation. Notes are never included in
CSV unless explicitly selected.

## Formats

### Designed PDF

- Uses warm Paper over lavender/blush sections
- Uses DM Sans throughout
- Removes application navigation and interactive controls
- Includes report period, generation time, time zone, and page number
- Includes a `Private work summary` label
- Uses text labels in addition to color in every chart
- Fits the common summary on one page; detail lists may add pages

### Data CSV

- UTF-8 with a header row
- Uses stable English column names
- Exports one metric row per date plus a period-total row
- Uses ISO `YYYY-MM-DD` dates
- Does not include visual styling or formulas
- Neutral filename suitable for spreadsheet tools

Filename patterns:

- `north-haven-daily-2026-08-07.pdf`
- `north-haven-weekly-2026-08-03-to-2026-08-07.pdf`
- `north-haven-monthly-2026-08.pdf`

## Metric consistency

Reports consume the same reporting projections and metric definitions as
Insights and Calendar. No report-specific recomputation is allowed.

- Worked counts distinct tickets with a work log in the period.
- Resolved and Closed count their respective status events.
- Plan Completion uses completed actionable plan items over eligible planned
  actionable items.
- Meetings are reported separately and never inflate ticket totals.
- Reopened tickets do not erase historical resolution or closure events.
- A day with no eligible data is explained rather than represented by a
  misleading zero-filled chart.

## Privacy and retention

- Generate exports only after authenticated, workspace-scoped authorization.
- Do not put report content or configuration in URLs.
- Do not log report titles, ticket titles, notes, customer content, or CSV rows.
- Generate on demand and stream directly to the browser.
- Do not persist report files in application storage during the MVP.
- Set private/no-store cache headers.
- Revoke temporary object URLs immediately after browser download.
- Analytics may record format and period type only, never report content.

The downloaded file becomes the user's responsibility. The interface explains
this before detailed ticket content is included.

## States

- **Preparing preview:** use a structural skeleton and retain selected options.
- **Generating:** disable only the Generate action and show `Preparing your report…`.
- **Ready:** begin the download and show `Your report is ready.`
- **No data:** show `There is not enough activity for this period.` and allow a
  different period.
- **Failed:** show `We couldn't create this report. Your settings are still here.`
  with `Try again`.
- **Detailed content:** show the privacy notice without using an alarm dialog.

## Accessibility

- The preview has a semantic heading structure and readable table alternative.
- Every chart includes a plain-text summary.
- PDF reading order follows the visible order.
- PDF text remains selectable; reports are not flattened images.
- CSV is an accessible alternative for users who need raw tabular data.

## Acceptance criteria

- Daily, Weekly, and Monthly produce accurate totals for their exact local
  date ranges.
- The same range matches Insights and Calendar totals.
- PDF styling remains recognizably North Haven without application chrome.
- Customer-sensitive details are excluded by default.
- No generated file remains in server storage after the response completes.
- Export failure never affects underlying work data.
- A report can be generated entirely with keyboard navigation.

## Implemented architecture

- `/insights/reports` is a child destination of Insights and does not appear in
  primary navigation.
- The entry selection is transferred through session storage; report settings,
  titles, notes, and customer content never enter a URL.
- Preview and export normalize the same protected daily, period-total,
  inventory, and status projections used by Calendar and Insights.
- Optional Ticket titles, Day Notes, and Follow-up Reasons are requested only
  after their individual controls are enabled.
- `@react-pdf/renderer` 4.5.1 produces server-side, selectable-text PDFs with
  repository-owned DM Sans Regular and Bold TTF files.
- `/api/reports/export` accepts authenticated same-origin POST requests, streams
  PDF or CSV responses, applies private/no-store headers, and never creates a
  report file in application storage.
- `claim_report_export_slot()` serializes limits per authenticated profile and
  allows at most six exports per minute without storing report content.

Implementation and verification details live in
`docs/19-report-builder-implementation.md`.

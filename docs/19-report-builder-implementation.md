# Report Builder implementation

Status: Phase 7 complete
Last updated: August 1, 2026

## Outcome

North Haven can now turn the same historical data shown in Calendar and Insights
into Daily, Weekly, or Monthly summaries. The Report Builder is entered through
Insights, keeps the application interface in English, and follows the approved
lavender, blush, Paper, and DM Sans visual system.

The user can review the exact local period, choose report sections, preview the
result, and download a designed PDF or data CSV. Exporting never changes a plan,
Work Item, status, follow-up, note, or Google Calendar event.

## Period behavior

- Daily uses one exact workspace-local date.
- Weekly starts and ends on the first and last configured working weekday in the
  selected ISO week. The normal schedule therefore produces Monday–Friday.
- Monthly uses one calendar month.
- Current periods are clipped through the workspace-local current date and are
  labeled `Through {date}`.
- Future anchors are normalized to the current local date on the server.

The initial builder selection is the current week. When entered from Week or
Month Insights, the matching report scale and anchor travel through session
storage. Report state and content never appear in the URL.

## Shared report view model

The server builds one typed `ReportView` from the existing protected projections:

- `reporting_daily_metrics(start, end)` for date rows and trends
- `reporting_period_totals(start, end)` for exact-period distinct totals
- `reporting_inventory_metrics(start, end)` for historical inventory
- `reporting_work_status_snapshot(date)` for mutually exclusive end status

PDF, CSV, and semantic HTML preview consume that same model. Worked, Resolved,
Closed, Plan Completion, Tasks, Reminders, and Meetings are not redefined by an
export renderer.

## Privacy controls

Summary Metrics, Trend Chart, Current Work Status, and Plain-language Summary
are enabled by default. Ticket Numbers and Titles, Day Notes, and Follow-up
Reasons are disabled independently by default.

Enabling a sensitive option loads only that optional content and displays:
`This report may contain customer information.` The preview never renders a
detail that is not selected. CSV detail columns remain empty unless their
matching option is enabled.

## Designed PDF

`@react-pdf/renderer` 4.5.1 renders the PDF in the Node runtime. DM Sans Regular
and Bold TTF assets plus their SIL Open Font License are checked into
`public/fonts/`, so report generation does not depend on a font CDN.

The PDF includes:

- North Haven and `Private work summary`
- exact report dates and partial-period label
- core metric cards
- a period-appropriate Daily outcome, Weekly resolution-outcome chart, or Monthly
  inventory trend
- end-of-period status and upcoming review count
- a plain-language summary
- generation time, workspace time zone, and page numbers
- optional detail sections that wrap onto additional pages

All content remains selectable text. The weekly chart uses weekday labels plus
per-day Resolved/Not resolved totals with matching color swatches beneath each
interval, so the PDF does not rely on color alone or a dense paragraph legend.
`Not resolved` means planned tickets that did not reach Resolved during that
day.

Optional detail sections are explicit when selected. Ticket numbers and titles,
Task titles, Day notes, and Follow-up reasons render matching rows when
available, and render a short empty-state sentence when no rows match the report
period or upcoming review window.

## Data CSV

The CSV is UTF-8 with a byte-order mark for spreadsheet compatibility. It uses
stable English headers, ISO dates, one row per report date, and one
`period_total` row. Values containing commas, quotes, or line breaks are escaped
according to CSV rules. The file contains no formulas or visual markup.

## Export boundary

`POST /api/reports/export`:

1. rejects cross-origin browser requests;
2. requires the Supabase SSR session;
3. claims a durable PostgreSQL generation slot;
4. validates every date, period, format, and inclusion flag with Zod;
5. rebuilds the authorized report model on the server;
6. streams the PDF or CSV with attachment and private/no-store headers.

The same-origin check compares the browser origin with the public `Host` or
`X-Forwarded-Host` value. This preserves the boundary when Next.js normalizes
an internal development URL to `localhost` while the canonical browser origin
is `127.0.0.1`, and it remains compatible with a hosted reverse proxy.

No report bytes are written to disk, object storage, a database, logs, or URLs.
Temporary browser object URLs are revoked immediately after download.

Migration `20260801001200_report_export_rate_limit.sql` creates a table with no
direct authenticated grants plus `claim_report_export_slot()`. An advisory
transaction lock makes the six-per-minute limit consistent across concurrent
application instances. The table stores only profile ID and request time and
deletes attempts older than one day for that profile.

## Verification

- unit coverage for Daily/Weekly/Monthly boundaries and privacy defaults
- plain-language summary and neutral filename coverage
- CSV date/total rows and escaping coverage
- semantic Report Builder and privacy-notice component coverage
- same-origin boundary coverage
- normalized local URL/public-host regression coverage
- real PDF buffer generation with embedded font assets
- opt-in integration coverage for the database-backed per-user rate limit
- full Vitest, TypeScript, ESLint, Prettier, and production build checks

## Phase 8 follow-up

- complete the keyboard and screen-reader audit with representative real reports
- verify Chrome, Safari, and Firefox desktop downloads
- validate report generation on the hosted Vercel/Supabase environment
- remove the synthetic Insights review data before normal personal use

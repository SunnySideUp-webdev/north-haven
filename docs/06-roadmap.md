# Roadmap

## Phase 0: product specification

Status: Complete and approved

### Deliverables

- Product foundation
- Information architecture
- UX behavior specification
- Data model
- Technical architecture
- English content foundation
- Decision log

### Exit criteria

- The owner approves the documented behavior.
- Ambiguous metric and ticket-status language is removed.
- No code is required for approval.

## Phase 1: low-fidelity UX

Status: Complete and approved

### Deliverables

- Detailed wireframes for Today, End of Day, Plan, Work, Ticket Detail,
  Calendar, Insights, and Settings
- Keyboard interaction map
- Empty, loading, OOO, stale-calendar, and error states
- Clickable flow prototype

### Exit criteria

- The complete evening-to-morning flow can be reviewed without explanation.
- The owner confirms information density and page hierarchy.
- No decorative visual decisions hide usability problems.

## Phase 2: visual system

Status: Complete and approved

### Deliverables

- Lavender/blush design tokens
- Typography and spacing system
- Table, form, navigation, and calendar patterns
- High-fidelity desktop designs
- Accessibility contrast validation

### Exit criteria

- The interface feels calm and editorial rather than corporate.
- Long tables remain readable.
- Every interaction has focus, hover, active, disabled, error, and loading
  treatment.

## Phase 3: technical foundation

Status: Local foundation complete; hosted environment and deployment hardening
continue in Phase 8

### Deliverables

- Next.js project
- Automated formatting, linting, type checking, and tests
- Supabase local and hosted environments
- SQL migrations and RLS policies
- Authentication and workspace setup
- Deployment pipeline and protected environment variables

### Exit criteria

- Authentication and workspace isolation are tested.
- A production-like environment can deploy from a clean checkout.
- Backup and migration procedures are documented.

## Phase 4: core work inventory

Status: Complete

### Deliverables

- Ticket create/edit/archive
- Configurable ticket types
- Operational and tracking statuses
- Notes, form backup, follow-ups, and history
- Inventory search, filters, and saved views
- Keyboard-efficient quick entry

### Exit criteria

- The owner can accurately represent the existing active inventory.
- Duplicate ticket handling and status history are reliable.
- Sensitive content is absent from logs and URLs.

## Phase 5: daily planning

Status: Complete

### Deliverables

- Daily plans
- Suggested sorting and manual selection
- Capacity guidance above eight items
- Today experience
- Tasks and reminders
- Four-step End of Day flow
- Work logs and day notes

### Exit criteria

- No item moves dates without explicit user action.
- A plan prepared Friday correctly becomes Monday's plan unless Monday is OOO.
- Today hides unplanned inventory by default.

## Phase 6: Google Calendar

Status: Complete. Corporate OAuth, calendar discovery, initial synchronization,
encrypted token storage, and refresh-token exchange were validated live on
August 1, 2026.

### Deliverables

- Corporate OAuth feasibility spike
- Read-only connection and calendar selection
- Initial and incremental synchronization
- Meeting display and attendance confirmation
- Official Out of Office handling
- Reconnect, stale data, and disconnect experiences

### Exit criteria

- Calendar failures do not block manual planning.
- No write permission is requested.
- OOO dates affect next-workday selection correctly.

## Phase 7: calendar and insights

Status: Complete. The shared reporting projections, retrospective monthly
Calendar, Day Summary, monthly notes, Week/Month/Quarter/Custom Insights,
accessible charts, Report Builder, and PDF/CSV exports are implemented.

### Deliverables

- Monthly work-history calendar
- Day Summary
- Weekly, monthly, quarterly, and custom-range insights
- Metric definitions and accessible chart summaries
- Daily, Weekly, and Monthly Report Builder
- Designed PDF export using the Insights visual language
- Data-only CSV export
- Privacy-safe detailed-content controls

### Exit criteria

- Calendar and Insights totals match for identical periods.
- Worked, Resolved, Closed, and Plan Completion remain semantically distinct.
- Daily, Weekly, and Monthly exports match Insights for identical periods.
- Report files are streamed on demand and are not retained server-side.

## Phase 7.5: product completion

Status: In progress

### Increment A: Complete Settings

Status: Implemented locally

- Accurate section navigation
- Editable Profile
- Editable working weekdays, hours, and IANA time zone
- Manual holidays and personal non-working days
- Existing Ticket Type and Google Calendar management
- Password update and global session revocation
- Explicit boundary between private reports and a complete workspace backup

### Increment B: Recovery and lifecycle states

Status: Complete

- Complete workspace backup
- Demonstrated restoration procedure
- Closed-day summary and confirmed reopen flow
- Clear archived-work recovery

### Increment C: Plan, Work, and End of Day parity

Status: Complete

- Complete approved Plan filters and navigation
- Restore approved Work Inventory and Ticket Detail actions
- Finish End of Day efficiency and completion-state details
- Global Search is included in the personal launch; manual meeting entry is
  deferred while the verified read-only Google Calendar connection remains the
  single meeting source

### Increment D: Authenticated coverage

Status: Pending

- Exercise critical authenticated workflows in a production-like CI environment
- Add Settings, recovery, report-download, and lifecycle browser coverage
- Reconcile implementation documents with the verified acceptance criteria

## Phase 8: hardening and personal launch

Status: Pending

### Deliverables

- Accessibility and keyboard audit
- Cross-browser desktop testing
- Security review
- Performance review
- Data export and restore test
- Report-generation privacy and accessibility audit
- Production launch checklist

### Exit criteria

- Critical workflows pass end-to-end tests.
- Backup restoration has been demonstrated.
- The owner can use North Haven for a full workweek without relying on test
  data.

## Deferred candidates

- Mobile-specific experience
- Offline mode
- Calendar event creation
- Ticket-system integration if credentials become available
- Attachments
- Recurring tasks
- Multiple workspaces or collaborators
- AI planning assistance

Deferred work must not distort the MVP data model or navigation before a real
need is observed.

# Roadmap

## Phase 0: product specification — current

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

Status: application implementation complete; live corporate OAuth validation
pending.

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

## Phase 8: hardening and personal launch

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

# North Haven project handoff

Last updated: August 2, 2026

This file is the safest starting point when continuing North Haven in a new
chat or development session. It summarizes the approved product direction and
points to the canonical specifications. Detailed documents take precedence if
this summary and a specification ever disagree.

## Resume instructions

1. Work from `/Users/sunny/Desktop/PROYECTOS PERSONALES/North Haven`.
2. Read this file and `README.md` first.
3. Read the numbered files in `docs/` in order.
4. Review `design/README.md` and `design/high-fidelity/README.md`.
5. Inspect existing files before creating or replacing anything.
6. Continue from the Current status section below; do not restart discovery.
7. Update this handoff whenever a phase is approved or the next step changes.

## Ready-to-use prompt for a new chat

> Continue the North Haven project located at
> `/Users/sunny/Desktop/PROYECTOS PERSONALES/North Haven`. Before making any
> changes, read `HANDOFF.md`, `README.md`, all numbered documents in `docs/`,
> and the design README files. Preserve all approved decisions and existing
> assets. Continue from the next step documented in `HANDOFF.md`; do not restart
> product discovery or implementation from scratch. Communicate with me in
> Spanish, but keep the application interface in English. Update `HANDOFF.md`
> when the phase is complete.

## Product in one sentence

North Haven is a calm, personal, desktop-first workday planner that hides the
full inventory from daily attention and makes tomorrow feel prepared before the
current workday ends.

It is not a replacement ticket system, Jira-style board, or traditional
calendar.

## Product promise

> Open North Haven and know what to do next in less than ten seconds.

## Current status

### Completed and approved

- Product vision, goals, principles, non-goals, and success measures
- Information architecture and navigation
- Core evening-to-morning workflows
- Ticket lifecycle and follow-up semantics
- Full UX behavior specification
- Data model
- Technical architecture
- Roadmap
- English interface terminology and content direction
- Low-fidelity wireframes for all primary screens
- High-fidelity visual direction for:
  - Visual system
  - Today
  - Plan
  - End of Day
  - Calendar
  - Work Inventory
  - Ticket Detail
  - Insights
  - Settings and Google Calendar connection
  - Critical interaction states
  - End of Day completion
  - Reporting entry, builder, export template, and period variants
- Lavender and blush color direction
- Fully sans serif, minimal typography direction

### Technical foundation and first Work Inventory increment

- Next.js App Router, React, TypeScript, Tailwind, and npm project scaffold
- Approved design tokens, DM Sans, desktop application shell, and working routes
- First Today implementation with synthetic ticket, Task, Reminder, and Meeting data
- Supabase SSR boundaries, environment validation, local config, initial workspace
  migration, signup provisioning, and RLS
- Docker-backed local Supabase stack, clean migration replay, and generated
  TypeScript database types wired into both Supabase clients
- Email/password authentication, account creation, password recovery/update,
  sign-out, and verified session refresh through Next.js Proxy
- Transactional first-time workday setup and authenticated application shell
- Local end-to-end authentication coverage and two-user RLS isolation coverage
- Formatting, linting, type checking, unit tests, browser tests, build checks, and CI
- Security-fixed dependency overrides with a clean npm audit
- Unified Work Item schema with distinct Ticket, Task, and Reminder detail tables
- Ticket types, dual status semantics, notes, follow-ups, backup timestamps, and
  automatic status history
- RLS-protected inventory read model and transactional create/update functions
- Real Work Inventory saved views, private local search, filters, and calm table
- English create, detail, edit, activity-note, and open-follow-up flows
- Browser coverage for creating, editing, closing, and finding a normal Task
- Integration coverage for duplicate Ticket handling, history, subtype
  distinction, and cross-workspace isolation
- Ticket Type management in Settings with activation and display ordering
- Follow-up completion/cancellation with retained history
- Global Quick Add and keyboard-efficient Work capture shortcuts
- Persisted Daily Plans with manual, duplicate-safe Work selection and ordering
- Draft and Ready states, intention, and calm capacity guidance above eight items
- Authenticated Today data that hides unplanned inventory and records progress
- Work logs and next-workday calculation that skips weekends/non-working dates
- Separate Plan navigation that includes OOO weekdays while continuing to skip
  holidays and manually blocked dates
- Plan Ready now shows a persistent calm confirmation panel with selected work
  counts, meeting count, and intention after the plan is saved
- Corrected Work search shortcut layout without overlap
- Four-step, resumable End of Day flow with persistent progress and day notes
- Explicit Done, Return, Deferred, Watching, and No Longer Needed outcomes
- Due follow-up decisions and transactional End of Day completion
- Calm next-workday-ready completion state with no automatic rollover
- Separate, optional Google OAuth connection that can use a corporate account
  independently from the North Haven sign-in
- Server-only AES-256-GCM token protection and browser-inaccessible Calendar
  tables
- Read-only calendar selection plus initial and incremental event sync
- Real meetings in Plan, Today, Calendar, and End of Day attendance review
- Official full-local-day Google OOO records integrated with next-workday
  calculation, including midnight-to-midnight events returned as timed records
- Reconnect, stale, denied, failure, manual sync, and disconnect experiences
- Live corporate Google OAuth consent, calendar discovery, initial sync, token
  encryption, and refresh-token exchange verified successfully
- Canonical local-origin handling prevents `localhost` and `127.0.0.1` from
  splitting the North Haven session during Google OAuth
- Local password recovery verified end to end through Mailpit
- Shared, workspace-scoped daily reporting projection for Calendar, Insights,
  and exports
- Six-week monthly Calendar with planned and completed work, resolution,
  confirmed meeting, important-note, and OOO indicators
- Calendar day cells show planned work split by Tickets, Tasks, and Reminders,
  plus scheduled Meetings from selected Google calendars
- Planned-only dates show a mini summary inside the cell instead of relying on
  the detached Day Summary panel
- OOO dates use the softer `#DDD5E6` planner lavender with muted purple text,
  and each in-month day exposes a hover-only appearance menu with five saved
  pastel colors plus Default
- Calendar appearance menus align by weekday column and can overflow the grid
  without being clipped near the month edges
- Workspace-scoped day colors are RLS protected and included in backup/restore
- In-place Day Summary with Plan vs Actual, outcomes, intention, and day note
- RLS-protected editable monthly notes and persistent month navigation
- Week, Month, Quarter, and Custom Range Insights with partial-period handling
- Exact-period reporting totals plus historical Active, Waiting, Watching, and
  ticket-age reconstruction
- Accessible Work Completed, Received vs Resolved, Active Inventory, Ticket Age,
  and Plan Completion charts with plain-language summaries
- OOO-aware average daily work that respects configured working weekdays
- High-fidelity-inspired Insights analysis surface with stacked activity bars
  and a mutually exclusive Active/Watching/Waiting donut
- Daily, Weekly, and Monthly Report Builder entered from Insights without a new
  primary-navigation destination
- Live designed-PDF and accessible CSV previews with exact local date ranges
- Server-rendered, selectable-text PDF using embedded DM Sans plus date-row and
  period-total UTF-8 CSV
- Privacy-safe detail controls that exclude ticket titles, day notes, and
  follow-up reasons until explicit opt-in
- Authenticated, same-origin, private/no-store export endpoint with a durable
  six-per-minute PostgreSQL limit and no retained report files
- Public-host-aware export validation that supports the canonical
  `127.0.0.1` local origin even when Next.js normalizes its internal URL to
  `localhost`
- Settings navigation with a truthful active section instead of a hard-coded
  Ticket Types state
- Editable Profile plus a transactional Work schedule that keeps profile and
  reporting time zones consistent
- Manual Holiday and Personal Day management integrated with next-workday
  calculation
- In-app password changes and global session revocation
- Versioned, secret-free JSON workspace backup streamed on demand
- Atomic workspace restoration with an exact confirmation phrase and rollback
  on any invalid row
- Confirmed meeting-outcome recovery across Google reconnection and sync
- Closed-day summary plus confirmed reopening
- Dedicated Archived inventory view and direct Restore to Active action
- Previous/next workday Plan navigation, complete saved and advanced filters,
  session persistence, schedule context, and recently-worked ordering
- Operational Work Inventory columns plus multi-select Add to Plan, Set Review,
  and guarded recoverable Archive actions
- Direct Work Detail planning, Days Worked history, duplicate recovery, and
  confirmations for sensitive lifecycle changes
- End of Day multi-ticket capture actions and embedded next-workday planning
- Closed-day first-focus and first-meeting summary
- Private Global Search across ticket number, title, type, notes, and secure link
- Explicit launch decision to keep Google Calendar as the single meeting source;
  manual meeting entry remains deferred while planning works offline
- Node.js 24 aligned across local development, GitHub Actions, and Vercel
- Authenticated CI job that boots a clean Supabase stack, replays migrations,
  verifies RLS, and runs the complete browser acceptance workflow
- Browser acceptance coverage for Settings, backup restoration, lifecycle,
  Global Search, Plan, End of Day, Insights, and PDF/CSV report downloads
- Hosted-test cleanup that removes its generated workspace and auth user
- Auth-user teardown that removes a sole-owner personal workspace atomically
  without changing North Haven's recoverable in-app archival behavior
- Hosted `North Haven Development` Supabase project in the Tokki organization,
  East US (North Virginia), linked to the repository with all 20 reviewed
  migrations applied and no demo or customer data
- Production Vercel project deployed in the Tokki team at
  `https://north-haven-steel.vercel.app`, with the stable domain aliased and
  public smoke coverage passing
- Supabase production and preview variables corrected through the Vercel CLI;
  the browser uses the default publishable key and server-only administration
  uses the legacy `service_role` key
- Production signup failures traced to Supabase's built-in two-auth-emails-per-
  hour allowance rather than invalid user credentials or a database failure
- Account creation now translates the Supabase email-rate-limit code into a
  calm, actionable message instead of a generic signup error
- Google Calendar client ID, client secret, and token-encryption key are stored
  as sensitive Vercel variables for Production and Preview; the production
  deployment has been rebuilt successfully with them
- Shared page headers use collision-safe grid layout instead of absolutely
  positioned actions; Work Detail uses a calmer compact title and explicit
  return navigation to Work Inventory, with matching exits on Create and Edit
- Ticket Work Detail provides auto-saving inline controls for operational
  status, tracking, and priority; status/tracking history, close/archive
  confirmations, RLS isolation, and open-plan archival guards remain intact
- The owner account, initial setup, and corporate Google Calendar connection
  have been completed successfully on the stable production deployment
- Plan availability now excludes work already selected in another non-closed
  daily plan, so tickets and tasks chosen for one day no longer reappear as
  Unplanned when planning a different day; the selection action also rejects
  stale cross-day duplicate additions with a clear message
- Today planned work rows open Work Detail directly from the item content with
  hover feedback, and Work Detail returns to Today when opened from Today while
  preserving the Work Inventory return path for Work-originated visits
- Google Calendar sync is still optional and non-blocking; provider requests
  now have an explicit timeout so a slow Google response fails with the calm
  sync error instead of leaving Settings pending indefinitely
- The planned-work date controls experiment was reverted. Work Inventory now
  has an icon-only permanent Delete action with confirmation for mistaken or
  nonexistent work records; this is separate from recoverable Archive
- Today supports explicit date navigation through `/today?date=YYYY-MM-DD`, so
  unfinished prior workdays can be reopened to mark progress, save notes, run
  End of Day, or review the dated plan

### Pending or not started

- Complete the authenticated portion of the Phase 7.5D hosted acceptance run
  after the built-in Supabase email allowance refills
- Verify hosted password recovery in a separate email-rate-limit window
- Phase 8 hardening and personal launch

Application code, local real-calendar validation, the hosted database schema,
and the Vercel production deployment now exist. The owner is actively entering
work in the hosted personal workspace, so it must be treated as production and
must never receive demo seeds. Final acceptance and password recovery remain to
be completed.

### Next step

Continue Phase 7.5D with the remaining cleanup-safe hosted acceptance checks and
password recovery, without altering the owner's real workspace or consuming
multiple Auth emails in the same one-hour window. The exact sequence is in
`docs/23-hosted-environment-implementation.md`. The completed reporting, Settings, and recovery
implementations are documented in
`docs/17-retrospective-calendar-implementation.md`,
`docs/18-insights-implementation.md`, and
`docs/19-report-builder-implementation.md`, plus
`docs/20-settings-implementation.md`, and
`docs/21-recovery-and-lifecycle-implementation.md`, plus
`docs/22-operational-parity-implementation.md`, and
`docs/23-hosted-environment-implementation.md`.

Server-side pagination remains a scale hardening task before the inventory
approaches the current 500-item boundary; it does not block the present workflow.

The hosted password-recovery check, remaining authenticated Today schedule data,
and recovery documentation remain open Phase 3 hardening tasks. They are
required before personal launch but do not
block Phase 7. Local Google Calendar credentials are configured in the ignored
environment file; they must never be copied into documentation or Git.

The current local personal workspace contains 16 clearly marked synthetic
`DEMO-INSIGHT-*` tickets for July 2026 so the approved Insights graphs can be
visually reviewed. They contain no customer information and can be removed with
`supabase/demo/remove_insights_demo.sql` without touching real work records.

## Confirmed product decisions

### User and platform

- Single personal user in the MVP
- Desktop-only initial experience
- Normal schedule: Monday-Friday, 8:00 AM-5:00 PM
- Product discussions may be in Spanish
- Every user-facing application label and message is in English

### Tickets

- Tickets live in a separate system without an available API key.
- The user enters new tickets manually, normally at the end of the day.
- Required ticket concepts include number, title, type, received date, status,
  priority, notes, resolution date, and form-backup completion.
- Source-system priority is preserved: Urgent, High, Medium, or Low.
- Most tickets are Medium.
- Planning suggestions place Urgent first, then due follow-ups, then the oldest
  active tickets.
- The user selects every daily item manually.
- Nothing rolls into another date automatically.
- Work manually selected for one open daily plan should not appear as available
  or Unplanned while planning another day unless it is removed from that plan
  or the source plan is closed.
- No drag-and-drop is required.

### Ticket semantics

- `Resolved`: the user's WordPress portion is complete.
- `Watching`: the ticket remains visible while a coworker completes temporary
  downstream changes to new forms.
- `Closed`: all downstream work is confirmed complete.
- The temporary form workflow is represented with generic follow-ups rather
  than hard-coded product logic.
- Form backup appears as a checkbox but stores a completion timestamp.

### Daily planning

- Today is the default destination.
- Today shows only deliberately planned work.
- Today can reopen previous work dates; it is not limited to the current local
  date when a specific date is requested.
- The full inventory remains available through Work and a secondary action.
- End of Day has four steps:
  1. Update Tickets
  2. Close Today
  3. Review Follow-ups
  4. Plan Next Workday
- A calm capacity warning appears at nine actionable items.
- The warning never blocks planning.
- Meetings default to `Probably Attended` after ending and are confirmed during
  End of Day.

### Google Calendar

- Use a corporate Google account.
- Start with read-only synchronization.
- Validate corporate OAuth permissions early.
- Read meetings and official Google Out of Office events.
- Official `outOfOffice` events create non-working dates only when they cover a
  complete local date.
- Google all-day records and exact local midnight-to-midnight OOO records count
  as full-day; lunch and outside-work OOO blocks remain partial.
- Full-day OOO dates are skipped when End of Day proposes the next workday.
- Plan treats OOO as context rather than a lock: work can be added, modified,
  reordered, and marked Ready on an OOO date.
- Previous/Next Plan navigation includes OOO weekdays while continuing to skip
  holidays and manually blocked dates.
- Calendar failure must never block manual ticket planning.

### Calendar and Insights

- The monthly Calendar is retrospective, not a traditional agenda.
- Day cells summarize planned tickets, tasks, reminders, scheduled Google
  meetings, and important notes.
- Metrics are kept out of Today.
- Insights distinguishes Worked, Resolved, Closed, and Plan Completion.
- There is no combined productivity score.

### Reports

- Reports are entered through Insights and do not add primary navigation.
- Daily, Weekly, and Monthly are supported.
- Designed PDF is primary; data-only CSV is secondary.
- Reports use the same metric definitions as Insights and Calendar.
- Ticket numbers, titles, notes, and follow-up content are excluded by default.
- Detailed content requires explicit opt-in and a privacy notice.
- Generated files are streamed on demand and are not retained by North Haven.
- The complete reporting extension is implemented and ready for personal
  visual review.

### Privacy and security

- Customer names, addresses, ZIP codes, and phone numbers may be stored with
  authorization.
- Customer content must never appear in URLs, analytics, logs, or error traces.
- Authentication, Row Level Security, server-only secrets, protected Google
  tokens, backups, and recoverable archival are MVP requirements.

## Approved visual direction

- Calm, spacious, minimal, modern, and planner-inspired
- Pastel lavender and blush pink over warm white
- No cats, mascots, or decorative illustration system
- No serif or decorative italic typography
- DM Sans across brand, page titles, navigation, tables, and forms
- Hierarchy through weight, scale, spacing, and restrained color
- Broad lavender page bands and blush secondary emphasis
- Tables use separators rather than many independent cards
- Shadows are minimal and mainly reserved for temporary overlays

The current visual specification is `docs/10-visual-system.md`.

## Technical direction

- Modular monolith
- Next.js App Router
- React and TypeScript
- Supabase PostgreSQL and Auth
- PostgreSQL Row Level Security
- SQL migrations with generated types
- Zod validation
- Tailwind CSS plus CSS custom properties
- Vitest, Testing Library, and Playwright
- Vercel deployment in the owner's Tokki team, using hosted Supabase and exact
  production OAuth origins
- No microservices, Redux, or separate Express backend for the MVP

## Canonical documents

- `README.md` — project entry point
- `docs/01-product-foundation.md` — vision, goals, vocabulary
- `docs/02-information-architecture.md` — navigation and flows
- `docs/03-ux-specification.md` — fields, behavior, and acceptance criteria
- `docs/04-data-model.md` — entities and data rules
- `docs/05-technical-architecture.md` — stack and implementation boundaries
- `docs/06-roadmap.md` — phased delivery plan
- `docs/07-content-design.md` — English UI language
- `docs/08-decision-log.md` — approved decisions
- `docs/09-low-fidelity-wireframes.md` — wireframe rationale
- `docs/10-visual-system.md` — current visual system
- `docs/11-interaction-states.md` — empty, saving, error, Calendar, OOO, and completion states
- `docs/12-reporting-and-exports.md` — Daily, Weekly, and Monthly report behavior
- `docs/13-technical-foundation.md` — implemented foundation and exact next increment
- `docs/14-work-inventory-implementation.md` — implemented Work Inventory slice and remaining Phase 4 work
- `docs/15-daily-planning-implementation.md` — persisted Plan and Today implementation and next Phase 5 increment
- `docs/16-google-calendar-implementation.md` — secure read-only Calendar implementation and live feasibility check
- `docs/17-retrospective-calendar-implementation.md` — shared daily metrics, monthly Calendar, Day Summary, and remaining Phase 7 work
- `docs/18-insights-implementation.md` — reporting periods, historical inventory, metric semantics, and accessible charts
- `docs/19-report-builder-implementation.md` — Report Builder, PDF/CSV generation, privacy controls, and export security
- `docs/20-settings-implementation.md` — Profile, schedule, non-working-day, and security Settings implementation
- `docs/21-recovery-and-lifecycle-implementation.md` — backup restoration, closed-day reopening, and archived recovery
- `docs/22-operational-parity-implementation.md` — Plan, Work, End of Day, and Global Search parity
- `docs/23-hosted-environment-implementation.md` — hosted Supabase, Vercel, OAuth, and acceptance-run procedure

## Design assets

- `design/wireframes/` — editable low-fidelity SVG sources
- `design/previews/` — low-fidelity PNG previews
- `design/high-fidelity/screens/` — editable visual-system SVG sources
- `design/high-fidelity/previews/` — high-fidelity PNG previews

## Current code foundation

- `src/app/` — App Router routes and layouts
- `src/features/` — feature-owned UI, rules, and tests
- `src/shared/` — shared UI, content, and validation
- `src/server/` — server-only database and security boundaries
- `supabase/migrations/` — reviewed database migrations and RLS
- `tests/e2e/` — Playwright workflows
- `.github/workflows/quality.yml` — automated verification

## Working rules for future sessions

- Do not overwrite approved files without inspecting them first.
- Preserve unrelated user files and changes.
- Keep interface copy in English.
- Keep planning discussions and handoffs understandable in Spanish if useful.
- Do not reintroduce serif, italic-display, mascots, gamification, Kanban, or
  automatic rollover without explicit product-owner approval.
- Treat Google Calendar as an enhancement rather than a core dependency.
- Verify work proportionally before declaring a phase complete.
- Update this handoff with the actual current status and next step.

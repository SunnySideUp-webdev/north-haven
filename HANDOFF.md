# North Haven project handoff

Last updated: July 31, 2026

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
- Official full-day Google OOO records integrated with next-workday calculation
- Reconnect, stale, denied, failure, manual sync, and disconnect experiences

### Pending or not started

- Live corporate Google OAuth feasibility validation and real token refresh
- Deployment configuration
- Phase 7 retrospective Calendar, Insights, and report exports

Application code now exists. Production data, authentication credentials,
Google Calendar credentials, and deployment configuration are not connected.

### Next step

Complete the final Phase 6 feasibility check with the real corporate Google
account. Create a Google Cloud Web application OAuth client, register
`http://127.0.0.1:3000/api/google-calendar/callback`, add the ignored local
credentials, and connect from Settings. Validate corporate consent, calendar
listing, meetings, official OOO events, refresh, reconnect, and disconnect.
The implementation is documented in
`docs/16-google-calendar-implementation.md`. Do not begin Phase 7 until the live
corporate connection is known to work or its policy blocker is documented.

Server-side pagination remains a scale hardening task before the inventory
approaches the current 500-item boundary; it does not block the present workflow.

The hosted Supabase development environment, hosted password-recovery check,
remaining authenticated Today schedule data, and recovery documentation remain
open Phase 3 hardening tasks. They are required before deployment but do not
block local Work Inventory development. Google Calendar credentials are now
required only for the live Phase 6 feasibility check; manual planning remains
usable without them.

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
- Official `outOfOffice` events create non-working dates.
- Full-day OOO dates are skipped when calculating the next workday.
- Urgent work can still be explicitly added to an OOO date.
- Calendar failure must never block manual ticket planning.

### Calendar and Insights

- The monthly Calendar is retrospective, not a traditional agenda.
- Day cells summarize actual tickets worked, resolved tickets, meetings, and
  important notes.
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
- The complete reporting extension is approved for implementation.

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
- Vercel deployment, subject to final data-hosting approval
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

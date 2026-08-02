# Technical architecture

## Architecture style

Use a modular monolith. The web application, server-side application layer, and
domain modules live in one Next.js project, backed by PostgreSQL. This keeps the
learning and deployment model approachable while preserving clear boundaries
for future growth.

No separate Express service, microservice mesh, queue, or client-side global
state framework is required for the MVP.

## Recommended stack

- Next.js App Router
- React and TypeScript
- Supabase PostgreSQL
- Supabase Auth
- PostgreSQL Row Level Security
- SQL migrations with generated TypeScript database types
- Zod for boundary validation
- React Hook Form for complex interactive forms where useful
- Tailwind CSS plus CSS custom properties for design tokens
- Accessible headless primitives only where native HTML is insufficient
- Vitest and Testing Library
- Playwright for end-to-end workflows
- Vercel for the web deployment, using its native Next.js runtime and a hosted
  Supabase project for PostgreSQL and Auth

Package versions are selected and locked when implementation begins rather than
recorded in the product specification.

## Application boundaries

### Presentation

- Route layouts and pages
- Feature-specific interactive UI
- English interface content
- Optimistic feedback only where failure can be cleanly reversed

### Application

- Server Functions for first-party mutations
- Route Handlers for OAuth callbacks, sync jobs, exports, and future webhooks
- Authorization checks at every server entry point
- Transactional services for status changes and End of Day completion

### Domain

- Daily planning rules
- Ticket lifecycle transitions
- Next-workday calculation
- Capacity warning rules
- Calendar attendance semantics
- KPI definitions

### Data

- PostgreSQL constraints and indexes
- RLS policies
- Query modules grouped by feature
- SQL views for protected, derived reporting

## Proposed project structure

```text
src/
  app/
    (auth)/
    (workspace)/
      today/
      plan/
      work/
      calendar/
      insights/
      insights/reports/
      settings/
  features/
    daily-planning/
    end-of-day/
    work-items/
    tickets/
    follow-ups/
    calendar-sync/
    insights/
    reports/
  shared/
    ui/
    forms/
    dates/
    validation/
    content/
  server/
    auth/
    database/
    security/
    observability/
supabase/
  migrations/
  seed/
tests/
  integration/
  e2e/
```

Feature modules own their queries, mutations, validation, tests, and UI. Shared
UI contains reusable primitives rather than domain-specific components.

## Rendering and state

- Default to Server Components for initial data and low-interactivity content.
- Use Client Components only for forms, selection, live progress, and browser
  interactions.
- Treat PostgreSQL as the source of truth.
- Keep transient draft interaction local to the feature.
- Do not introduce Redux for the MVP.
- Revalidate the smallest affected route or query after mutation.

## Google Calendar integration

### Permissions

Request read-only event access and, if multiple calendar selection is enabled,
read-only calendar-list access. Do not request event write scopes.

### Flow

1. User starts OAuth from Calendar Settings.
2. Server creates state and PKCE material where supported.
3. Google redirects to a server-only callback.
4. Server validates state, stores protected token material, and performs an
   initial bounded sync.
5. Selected calendars receive incremental sync tokens.
6. Subsequent syncs request only changes since the prior token.
7. Invalidated tokens trigger a safe full resync of that calendar.

### Data minimization

Store only identifiers, title, start/end, event type, status, Google URL, and
meeting URL. Do not store descriptions, attendees, attachments, or Google Meet
conference identifiers that are not needed by the user interface.

### OOO

Use the provider event type, not title matching. Full-day `outOfOffice` events
include provider all-day records and exact local midnight-to-midnight intervals.
They create local non-working dates. Partial events are shown as calendar
context but do not remove the entire workday.

### Early technical spike

Before building the full calendar UI, validate that the corporate account can:

- Complete OAuth consent
- Grant the required read-only scopes
- List the intended calendars
- Return meeting and Out of Office event types
- Refresh access without repeated manual authorization

Calendar failure must never block manual planning.

## Reporting and export architecture

- Build a shared, typed reporting query layer consumed by Calendar, Insights,
  PDF, and CSV outputs.
- Normalize results into a report view model before rendering any format.
- Render the on-screen preview from semantic HTML using the same design tokens
  as Insights.
- Generate PDFs server-side from a dedicated report renderer or print-safe HTML
  pipeline selected during an early implementation spike. The chosen approach
  must produce selectable text and predictable page breaks.
- Stream PDF and CSV responses directly with attachment, private, and no-store
  headers. Do not write generated reports to persistent storage.
- Validate period, local dates, format, and every inclusion flag with Zod.
- Authorize workspace access again at the export boundary and rate-limit report
  generation.
- Keep ticket titles, notes, and follow-up text out of exports unless the
  request explicitly opts in.

The implemented PDF renderer is `@react-pdf/renderer` 4.5.1 on the Node runtime.
It embeds repository-owned DM Sans TTF assets, supports predictable wrapping and
fixed page-number footers, and streams its Node output through the Next.js Route
Handler. CSV remains a dependency-free server renderer.

## Security model

- Authentication is required for every product route.
- RLS is enabled on every exposed business table.
- Policies scope data through workspace membership.
- Service-role credentials and Google tokens remain server-only.
- Secrets are stored only in managed environment configuration.
- Sensitive content is redacted from logs, traces, errors, and analytics.
- Security headers include a restrictive Content Security Policy.
- Forms use schema validation on both client and server boundaries.
- Mutations verify authorization even when RLS provides defense in depth.
- Rate limits protect sign-in, exports, and expensive search operations.
- Normal deletion is recoverable archival.
- Database backups and restoration are tested before production use.
- User-operated workspace recovery uses a versioned, secret-free JSON contract
  and one PostgreSQL transaction. OAuth credentials and provider cache remain
  outside the portable backup boundary.
- Restored meeting outcomes are keyed by provider calendar/event identity and
  wait in a server-only recovery queue until a matching sync record exists.
- Dependency and secret scanning run in continuous integration.

## Observability

Capture technical event names and identifiers only. Never capture ticket titles,
notes, customer names, addresses, phone numbers, calendar titles, or access
tokens.

Useful events include:

- End of Day started/completed
- Plan marked Ready
- Calendar sync succeeded/failed
- Ticket creation failed by validation category
- Server operation latency
- Report generated/failed by period type and format only

## Testing strategy

### Unit

- Next-workday calculation
- OOO date expansion
- Priority suggestion ordering
- Ticket transition rules
- Capacity warning threshold
- KPI formulas
- Daily, weekly, and monthly report-period boundaries
- Report inclusion and privacy defaults

### Integration

- RLS isolation
- Ticket creation and duplicate detection
- End of Day transaction
- Resolve, Watch, and Close transitions
- Calendar sync-token handling
- Report authorization and metric parity
- PDF/CSV response headers and no-store behavior

### End to end

- First sign-in and setup
- Add several tickets with keyboard-only entry
- Plan tomorrow and mark Ready
- Start Today and finish work
- Complete End of Day without automatic rollover
- Display OOO as planning context without disabling normal plan operations
- Disconnect and reconnect Google Calendar
- Export a weekly PDF and a monthly CSV without detailed ticket content

## Performance expectations

- Today should render usable content quickly on a normal corporate connection.
- Search should return an exact ticket match in under one second for the expected
  personal dataset.
- Tables use server-side pagination before inventory size becomes a browser
  burden.
- Calendar sync is incremental and does not block initial page rendering.

# Google Calendar implementation

Status: Complete; live corporate OAuth and refresh verified
Last updated: August 1, 2026

## Outcome

North Haven now has a separate, optional Google Calendar connection. The
North Haven sign-in account and the connected Google account are deliberately
independent, so a personal North Haven login can authorize a corporate work
calendar from Settings.

The integration is read-only. Calendar failure, stale data, denied corporate
consent, and disconnection never block Work, Plan, Today, or End of Day.

The real corporate Google Workspace account completed consent successfully,
returned its readable calendar list, synchronized the selected primary
calendar, and passed a direct refresh-token exchange. Phase 6 is complete.

## OAuth and security

- OAuth begins explicitly in Settings and always lets the user choose a Google
  account.
- The server validates a short-lived, HTTP-only state cookie before accepting
  the callback.
- Requested Google Calendar scopes are events.readonly and
  calendarlist.readonly. No event-write scope is present.
- Offline access provides refresh capability without repeated authorization.
- Access and refresh tokens are encrypted with AES-256-GCM before storage.
- Token, connection, sync-token, event, and meeting-outcome tables are not
  available through the authenticated browser database role.
- Authenticated server entry points derive the user's workspace before a
  service-role operation.
- Provider response bodies, event titles, calendar names, and tokens are not
  written to logs or URL parameters.

## Database implementation

Migration 20260731000700_google_calendar.sql adds:

- one protected Google connection per workspace
- selected external calendars and protected incremental sync tokens
- minimized external event records
- meeting attendance outcomes
- full-day Google OOO records in non-working days
- meeting-only Ready-plan support
- RLS enabled on all Calendar tables, with browser privileges revoked

Stored event content is limited to identifiers, title, start/end, event type,
status, provider URL, meeting URL, and provider update time. Descriptions,
attendees, attachments, and conference metadata are not retained.

## Synchronization

- The initial sync is bounded from 120 days in the past through 400 days in the
  future.
- Selected calendars receive incremental sync tokens.
- Deleted events are removed locally.
- An invalidated Google sync token triggers a safe full refresh.
- Access tokens refresh server-side using the encrypted refresh token.
- Google network calls are explicitly time-bounded so a slow provider request
  returns the existing non-blocking sync error instead of leaving Settings in an
  indefinite pending state.
- Google outOfOffice is recognized by provider event type, never title matching.
- Only full-local-day OOO events create non-working dates. Google all-day
  records use an exclusive end date, while timed records qualify only when they
  cover exact local midnight to midnight.
- Real corporate data confirmed that partial OOO blocks may represent lunch or
  time outside working hours. These remain partial and never suppress a whole
  workday.
- Deselecting or disconnecting a calendar removes its derived OOO dates without
  changing manual non-working dates.

## Product integration

Settings provides connection state, the connected account label, calendar
selection, last successful sync, Sync now, reconnect, and confirmed disconnect.

Plan shows meetings automatically, excludes them from capacity, allows a
meeting-only plan to become Ready, and keeps normal planning available on an
OOO day while preserving the absence indicator.

Today shows meeting times and Google links, keeps action-item progress separate
from meetings, and presents OOO or stale-calendar states without hiding the
manual work plan.

End of Day lets the user confirm Attended, Did not attend, Cancelled, or Not
applicable. Ended meetings appear as Probably attended until explicitly
confirmed.

Calendar now provides the connected-account state, today's meeting context, and
OOO state. The retrospective monthly grid remains Phase 7.

## Live feasibility result

The corporate policy check succeeded on August 1, 2026:

- the Google Calendar API and Web OAuth client were accepted inside the
  corporate Google Cloud organization
- corporate consent completed with the intended read-only scopes
- North Haven listed readable calendars and selected the primary calendar by
  default
- the bounded initial synchronization completed with an incremental sync token
- stored access and refresh tokens were confirmed encrypted rather than raw
- a real refresh-token exchange returned a fresh access token and expiry
- the connection remained healthy with no provider error

The live test also exposed a local-only authentication edge case. Browser
cookies created on `localhost` are not available to a callback registered on
`127.0.0.1`. North Haven now transitions all local browser access to the
configured `http://127.0.0.1:3000` origin before authentication. Exact local
password-recovery callbacks are allow-listed, and recovery through Mailpit was
verified without deleting the account.

The ignored `.env.local` contains the local-only OAuth and encryption values.
No OAuth credential or token is committed to GitHub. A deployed environment
must register its own HTTPS callback and protected environment variables.

## Verification completed

- clean migration replay
- generated TypeScript database contract
- unit coverage for provider all-day expansion, local midnight-to-midnight OOO,
  rejection of partial OOO blocks, time-zone dates, canonical local origin, and
  read-only scopes
- browser-role denial on protected Calendar tables
- service-only Calendar persistence
- meeting-only Ready plan isolation across two workspaces
- Google OOO next-workday behavior
- live corporate consent, calendar discovery, initial sync, encrypted storage,
  and refresh-token exchange
- local password recovery after canonical-origin enforcement
- full existing Chromium workflow
- format, lint, type checking, unit tests, integration tests, and production build

## Next product phase

Phase 7 now builds the retrospective monthly Calendar, Day Summary, Insights,
and Daily, Weekly, and Monthly exports.

# Google Calendar implementation

Status: Application implementation complete; live corporate OAuth validation pending
Last updated: July 31, 2026

## Outcome

North Haven now has a separate, optional Google Calendar connection. The
North Haven sign-in account and the connected Google account are deliberately
independent, so a personal North Haven login can authorize a corporate work
calendar from Settings.

The integration is read-only. Calendar failure, stale data, denied corporate
consent, and disconnection never block Work, Plan, Today, or End of Day.

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
- Google outOfOffice is recognized by provider event type, never title matching.
- Only full-day OOO events create non-working dates; the Google end date is
  treated as exclusive.
- Deselecting or disconnecting a calendar removes its derived OOO dates without
  changing manual non-working dates.

## Product integration

Settings provides connection state, the connected account label, calendar
selection, last successful sync, Sync now, reconnect, and confirmed disconnect.

Plan shows meetings automatically, excludes them from capacity, allows a
meeting-only plan to become Ready, and explains explicit urgent planning on an
OOO day.

Today shows meeting times and Google links, keeps action-item progress separate
from meetings, and presents OOO or stale-calendar states without hiding the
manual work plan.

End of Day lets the user confirm Attended, Did not attend, Cancelled, or Not
applicable. Ended meetings appear as Probably attended until explicitly
confirmed.

Calendar now provides the connected-account state, today's meeting context, and
OOO state. The retrospective monthly grid remains Phase 7.

## Required live feasibility check

The local application and database behavior are verified, but the corporate
Google Workspace policy cannot be simulated. To complete Phase 6:

1. Enable Google Calendar API in a Google Cloud project.
2. Configure an OAuth consent screen and a Web application OAuth client.
3. Register this exact local redirect URI:
   http://127.0.0.1:3000/api/google-calendar/callback
4. Add the client ID, client secret, local Supabase service-role key, and a
   generated base64 encryption key to the ignored local environment file.
5. Authorize the corporate account from Settings.
6. Confirm calendar listing, meetings, official OOO events, manual sync, token
   refresh, reconnect, and disconnect.

No OAuth credential or token may be committed to GitHub.

## Verification completed

- clean migration replay
- generated TypeScript database contract
- unit coverage for all-day expansion, time-zone dates, and read-only scopes
- browser-role denial on protected Calendar tables
- service-only Calendar persistence
- meeting-only Ready plan isolation across two workspaces
- Google OOO next-workday behavior
- full existing Chromium workflow
- format, lint, type checking, unit tests, integration tests, and production build

## Next product phase

After the live corporate OAuth check succeeds, Phase 7 builds the retrospective
monthly Calendar, Day Summary, Insights, and Daily, Weekly, and Monthly exports.

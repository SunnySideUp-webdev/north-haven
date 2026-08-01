# Settings implementation

Status: Phase 7.5A implemented locally
Last updated: August 1, 2026

## Outcome

Settings now uses a real section destination rather than a list of anchors that
pointed to missing content. Profile is the calm default section, an OAuth result
opens Calendar connection, and the active navigation treatment always matches
the visible section.

The implemented destinations are:

- Profile
- Work schedule
- Ticket types
- Calendar connection
- Data and privacy
- Security

Data and privacy accurately explains the current report protections and the
remaining workspace-recovery boundary. It does not imply that a PDF or CSV
report is a complete backup.

## Profile

The owner can update the display name shown in the application shell. The
sign-in email is displayed read-only; email changes are intentionally outside
the personal MVP.

`update_profile_settings()` validates length inside PostgreSQL, derives identity
from `auth.uid()`, and relies on the existing own-profile RLS policy. The Server
Action validates the same boundary with Zod and revalidates the application
layout after a successful update.

## Work schedule

The owner can update:

- working weekdays
- local start and end time
- IANA time zone

`update_work_schedule_settings()` updates `work_schedules.time_zone` and
`profiles.time_zone` in one transaction. This prevents Today, Plan, Calendar,
Insights, and Reports from reading different time-zone values. PostgreSQL also
validates the IANA name against `pg_timezone_names`, the workday set, and the
time order.

Capacity guidance remains fixed at the approved threshold of nine actionable
items. Suggested work remains Urgent, follow-ups due, then oldest active. These
rules are visible but are not presented as preferences North Haven cannot yet
persist.

## Non-working days

Work schedule can add future Manual or Holiday dates and remove only records
whose source is `manual`. Google Out of Office records remain provider-owned and
continue to be managed by calendar synchronization. Existing RLS derives the
personal workspace and keeps manual dates private.

Manual dates feed the existing `next_workday()` function immediately, so Plan
and End of Day skip them without moving any work automatically.

## Security

Security displays the authenticated email, supports an in-session password
change with the existing twelve-character rule, and offers confirmed global
session revocation. Every action authenticates again at the server boundary and
returns neutral errors.

Account deletion is not implemented. It requires an explicit product decision
and stronger destructive-action handling rather than being inferred from the
presence of a Security section.

## Verification

- validation coverage for profile, schedule, IANA time zone, password, and
  non-working-day inputs
- component coverage for default, hash-selected, and OAuth-result destinations
- integration coverage for transactional profile/schedule updates and invalid
  database time zones
- authenticated Chromium coverage for saving Profile and Work schedule before
  continuing through Ticket Types and the core daily workflow
- TypeScript and ESLint checks

## Next increment

Phase 7.5B will add a complete workspace backup and demonstrated restoration
path, Closed Day reopening, and explicit archived-work recovery. Deployment
does not begin until those recovery paths are verified.

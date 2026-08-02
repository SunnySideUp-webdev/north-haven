# Decision log

## Product

- North Haven is a daily work planner, not a replacement ticket system.
- The primary unit of attention is a Daily Plan.
- The full inventory is intentionally hidden from Today.
- End of Day combines manual ticket entry, outcome review, follow-up review, and
  planning the next workday.
- Work never rolls into another date automatically.

## Tickets

- Tickets are entered manually at the end of the day.
- The source-system priority is preserved.
- Suggested planning order is Urgent, due follow-ups, oldest active tickets,
  then remaining priority levels.
- The user's daily order is stored separately from system priority.
- Resolved means the user's portion is complete.
- Closed means downstream changes are confirmed complete.
- The temporary form-change workflow is represented through generic follow-ups.
- Form backup appears as a checkbox but stores a completion timestamp.

## Calendar and schedule

- Google Calendar is read-only in the MVP.
- The account is corporate; OAuth permission must be validated early.
- Official Google Out of Office events define non-working dates.
- A Google OOO event counts as full-day when it is an all-day record or covers
  exact local midnight to midnight. Partial lunch and outside-work OOO blocks
  never suppress the workday.
- Normal schedule is Monday-Friday, 8:00 AM-5:00 PM.
- OOO is informational inside Plan, not a planning restriction. Work can be
  added, edited, reordered, and marked Ready on an OOO date.
- Marking a plan Ready should leave a visible saved confirmation on the Plan
  screen, including the date, selected work count, meeting count, and intention.
- End of Day still skips full-day OOO dates when proposing the next workday, so
  an absence never becomes a required plan.
- Meetings default to Probably Attended after ending and are confirmed during
  End of Day.
- Google Calendar remains the only meeting source for the personal launch.
  Manual meeting entry is deferred to avoid duplicate records and unclear
  source semantics; Calendar failure never blocks manual work planning.
- Calendar cells show planned work before the date is worked, so future plans
  are visible without opening Day Summary.
- A hover-only appearance menu stores optional pastel day colors. These colors
  are presentation metadata and never change the meaning of OOO or work data.
- OOO uses the softer planner lavender `#DDD5E6`; custom color menus must avoid
  clipping at the calendar edges.

## Experience

- The application interface is English.
- Product design discussions can continue in Spanish.
- Desktop is the only initial target.
- Navigation is horizontal.
- Visual identity is pastel lavender and blush pink with warm white surfaces.
- No cats, mascots, or decorative illustration system in the MVP.
- Capacity guidance appears at nine actionable items and never blocks planning.
- Insights are separated from Today.
- No combined productivity score is used.
- Daily, Weekly, and Monthly reports live within Insights rather than primary
  navigation.
- Designed PDF is the primary report format; CSV is a secondary data format.
- Reports reuse the exact metric definitions and visual language of Insights.
- Customer-sensitive work details are excluded from reports by default and
  require explicit opt-in.
- Private Global Search is included in the personal launch. It searches work
  number, title, type, notes, and secure external link without placing the
  query in the URL; archived work stays excluded until explicitly requested.

## Architecture and privacy

- Use a modular monolith with Next.js, TypeScript, PostgreSQL, and Supabase.
- Store the minimum useful Google event data.
- Customer names, addresses, ZIP codes, and phone numbers may be stored with
  authorization, but must be excluded from URLs, logs, and analytics.
- Authentication, Row Level Security, server-only credentials, backups, and
  recoverable archival are MVP requirements.
- North Haven uses email and password for its own account flow. Passwords must
  contain at least 12 characters; Google Calendar OAuth remains a separate,
  optional corporate authorization.
- Generated report files are streamed on demand and are not retained in server
  storage during the MVP.
- Workspace backups use a versioned JSON contract, are generated on demand, and
  are never retained by North Haven. They exclude authentication secrets,
  sessions, Google OAuth tokens, and reproducible provider cache.
- Workspace restoration is an explicitly confirmed, atomic replacement of
  user-owned workspace content. The current Google connection stays intact;
  confirmed meeting outcomes wait safely for a matching event after sync.
- Closed days and archived work remain reversible. Reopening a day preserves
  its history and returns to End of Day review; restoring archived work returns
  it to Active.
- Vercel is the selected web deployment platform for the personal launch. It
  provides the native deployment path for the existing Next.js application.
  The Vercel account and Tokki team are separate from the owner's existing
  Netlify deployment, which remains untouched.
- Local development uses `http://127.0.0.1:3000` as the canonical browser
  origin because browser cookies are not shared with `localhost`.

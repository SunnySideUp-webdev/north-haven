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
- Normal schedule is Monday-Friday, 8:00 AM-5:00 PM.
- Urgent work can be added explicitly to an OOO date.
- Meetings default to Probably Attended after ending and are confirmed during
  End of Day.

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

## Architecture and privacy

- Use a modular monolith with Next.js, TypeScript, PostgreSQL, and Supabase.
- Store the minimum useful Google event data.
- Customer names, addresses, ZIP codes, and phone numbers may be stored with
  authorization, but must be excluded from URLs, logs, and analytics.
- Authentication, Row Level Security, server-only credentials, backups, and
  recoverable archival are MVP requirements.
- Generated report files are streamed on demand and are not retained in server
  storage during the MVP.

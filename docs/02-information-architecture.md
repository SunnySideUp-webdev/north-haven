# Information architecture and flows

## Primary navigation

North Haven uses a quiet horizontal navigation to preserve the editorial,
planner-like composition of the page.

1. **Today**
2. **Plan**
3. **Work**
4. **Calendar**
5. **Insights**

Global Search and Settings sit on the trailing edge. The active destination is
shown with a lavender underline or very light blush background.

## Screen inventory

### Access and setup

- Sign in
- First-time setup
- Connect Google Calendar
- Calendar selection

### Daily control

- Today
- End of Day
- Plan a Day
- Plan ready confirmation
- OOO day

### Work inventory

- Work list
- Create ticket
- Quick ticket entry
- Ticket detail
- Create task
- Create reminder
- Waiting and Watching saved views
- Global search results

### History and reflection

- Monthly Calendar
- Day Summary panel
- Insights
- Report Builder, entered from Insights
- Report Preview and download

### Administration

- Profile and work schedule
- Ticket types
- Google Calendar connection
- Data export
- Security and session settings

## Core flow: end of day

The ritual is autosaved and can be resumed.

1. **Update tickets**
   - Add tickets received today.
   - Update notes, backup status, workflow status, and priority.
   - Optionally save a new ticket directly into the next workday plan.
2. **Close today**
   - Confirm each planned item's outcome.
   - Explicitly re-plan, return to inventory, keep watching, or complete each
     unfinished item.
   - Confirm meeting attendance.
3. **Review follow-ups**
   - Review due and overdue Waiting or Watching tickets.
   - Set the next review date or close the follow-up.
4. **Plan next workday**
   - Use the next eligible workday selected by the system.
   - See meetings and OOO context from Google.
   - Select tickets, tasks, and reminders manually.
   - Receive a non-blocking capacity warning above eight actionable items.
5. **Finish**
   - Mark the plan Ready.
   - Show a calm summary and permission to end the workday.

## Core flow: start of day

1. Sign in and land on Today.
2. Read the plan summary and next meeting.
3. Begin the first planned item.
4. Mark items In Progress or Done as work advances.
5. Consult unplanned work only through an intentional secondary action.

## Core flow: resolve and watch a ticket

1. Mark the operational status Resolved.
2. Record `resolved_at` automatically.
3. Select Watching as the tracking state.
4. Add a generic follow-up reason, owner/dependency, and next review date.
5. Keep the ticket visible in Watching until the external work is confirmed.
6. Mark Closed and record `closed_at`.

## Core flow: Google Calendar

1. Connect a corporate Google account through OAuth.
2. Grant read-only event access.
3. Select calendars to display.
4. Import minimal event metadata.
5. Display meetings automatically in Today and Plan.
6. Convert official Out of Office event dates into non-working dates.
7. Confirm attendance during End of Day without modifying Google.

## Core flow: export a work summary

1. Open Insights and select `Export report`.
2. Choose Daily, Weekly, or Monthly.
3. Choose the period and review the calculated preview.
4. Keep summary metrics, trends, and status enabled by default.
5. Explicitly opt in if ticket titles, notes, or other detailed content is
   needed.
6. Generate a designed PDF or a data-only CSV.
7. Download the report without persisting a server-side copy.

Reports remain subordinate to Insights and do not add a sixth primary
navigation destination.

## OOO behavior

- An official Google `outOfOffice` event marks each complete local date
  non-working. Complete coverage may arrive as an all-day record or an exact
  local midnight-to-midnight interval.
- End of Day skips OOO dates when choosing the next required workday.
- A partially covered date remains a workday and displays the OOO interval.
- Plan navigation includes OOO weekdays, and all normal add, edit, reorder, and
  Ready controls remain available without confirmation.
- Holidays and manually blocked dates remain excluded from Previous/Next Plan
  navigation but can still be reached deliberately through the date picker.
- If Google is disconnected, existing OOO records remain visible with a stale
  indicator until reconnection.

## Search behavior

Global Search opens without leaving the current context and searches:

- Ticket number
- Ticket title
- Ticket type
- Notes
- External link

Results prioritize exact ticket-number matches, then active items, then recent
activity. Archived items are excluded by default but can be included.

## Desktop layout

- Supported target: modern desktop browsers at 1280 px wide and above.
- Primary content remains usable at 1024 px with reduced side context.
- A sticky top navigation preserves access to the five main destinations.
- Planner pages use an optional 260-300 px contextual rail and one dominant
  content surface.
- Tables use sticky headers and horizontal overflow only as a last resort.

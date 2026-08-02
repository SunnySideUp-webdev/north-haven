# English interface content

## Voice

North Haven is calm, direct, and supportive. It describes facts and offers a
clear next action. It does not celebrate routine actions excessively or imply
failure.

Use:

- `Your next workday is ready.`
- `Two follow-ups need a decision.`
- `This plan is larger than your usual day.`

Avoid:

- `Amazing job! You crushed it!`
- `You are falling behind.`
- `Overdue disaster`

## Primary navigation

- Today
- Plan
- Work
- Calendar
- Insights
- Search
- Settings

## Ticket terminology

### Operational status

- Pending
- In Progress
- Waiting for Response
- Resolved

### Tracking state

- Active
- Watching
- Closed
- Archived

### Daily execution

- Planned
- In Progress
- Done
- Returned to Inventory
- Deferred
- Skipped

### Priority

- Urgent
- High
- Medium
- Low

## End of Day

### Steps

1. Update Tickets
2. Close Today
3. Review Follow-ups
4. Plan Next Workday

### Actions

- Start End of Day
- Save and Exit
- Save and Add Another
- Save and Add to Next Workday
- Continue
- Back
- Finish End of Day

### Completion

Title: `Your next workday is ready.`

Supporting pattern:

> Monday, August 10
>
> 6 tickets · 1 meeting · 2 reminders
>
> You can leave the rest here for tomorrow.

## Empty states

### Today without a plan

Title: `Nothing is planned for today.`

Body: `Choose a few items from your work inventory to create a clear plan.`

Actions: `Plan Today`, `View Work Inventory`

### OOO day

Title: `You are out of office today.`

Body: `Your OOO status stays visible, and planning remains fully available
whenever you need it.`

Action: `Plan This Day`

### Empty inventory

Title: `Your work inventory is empty.`

Body: `Add your first ticket when you are ready.`

Action: `Add Ticket`

### No search results

Title: `No matching work found.`

Body: `Check the ticket number or remove a filter.`

Actions: `Clear Filters`, `Add Ticket`

### No insights data

Title: `There is not enough activity for this period.`

Body: `Choose a wider date range or return after completing a few workdays.`

## Capacity warning

Title: `This is a full day.`

Body pattern: `You planned {count} items. Your usual day contains 6-8. You can
keep this plan or remove something.`

Actions: `Keep Plan`, `Review Items`

## Calendar states

### Not connected

Title: `Connect Google Calendar`

Body: `See meetings and Out of Office time alongside your work plan. North Haven
will request read-only access.`

Action: `Connect Calendar`

### Stale

Title: `Calendar has not synced recently.`

Body pattern: `Your last successful sync was {relative time}. Cached meetings
remain visible.`

Actions: `Sync Now`, `Reconnect`

### Disconnected

Title: `Google Calendar is disconnected.`

Body: `Your work plans are safe. Reconnect to refresh meetings and Out of Office
time.`

Action: `Reconnect`

## Validation and errors

- `Enter a ticket number.`
- `A ticket with this number already exists.`
- `Enter a ticket title.`
- `Choose a ticket type.`
- `Choose a valid received date.`
- `Enter a valid HTTPS link.`
- `This change could not be saved. Your draft is still available.`
- `North Haven could not sync Google Calendar. Your work plan is still
  available.`

## Confirmation language

### Close ticket

Title: `Close this ticket?`

Body: `Use Closed when all downstream work has been confirmed complete.`

Actions: `Close Ticket`, `Cancel`

### Remove backup confirmation

Title: `Mark the form backup as incomplete?`

Body: `The previous completion time will remain in the activity history.`

Actions: `Mark Incomplete`, `Cancel`

### Disconnect Google

Title: `Disconnect Google Calendar?`

Body: `North Haven will stop syncing meetings and Out of Office time. Your
ticket data and work plans will not be affected.`

Actions: `Disconnect`, `Keep Connected`

## Metric labels

- Tickets Worked
- Tickets Resolved
- Tickets Closed
- Active Tickets
- Waiting for Response
- Watching
- Daily Average
- Plan Completion
- Average Ticket Age

Do not use `Tickets Completed` because it can be confused with Resolved, Closed,
or a completed daily plan item.

## Reports

### Entry and builder

- Export Report
- Daily
- Weekly
- Monthly
- Report Settings
- Date Range
- Summary Metrics
- Trend Chart
- Current Work Status
- Ticket Numbers and Titles
- Designed PDF
- Data CSV
- Generate PDF
- Download CSV
- Back to Insights

Privacy helper: `Off by default to protect customer information.`

Retention helper: `Generated on demand · not stored by North Haven.`

Detailed-content notice: `This report may contain customer information.`

### Generation states

- `Preparing your report…`
- `Your report is ready.`
- `We couldn't create this report. Your settings are still here.`
- `Try Again`

### Report titles

- Daily Work Summary
- Weekly Work Summary
- Monthly Work Summary
- Private Work Summary
- Week in Brief
- Month in Brief

Use `report`, not `analytics export`, in user-facing language.

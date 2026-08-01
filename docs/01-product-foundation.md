# Product foundation

## Vision

North Haven is a calm daily control center for a person managing a large,
long-lived work inventory across multiple systems. It makes the workday feel
pre-organized by separating the full inventory from the small set of items that
deserve attention today.

## Primary outcome

At the beginning of a workday, the user should be able to answer these questions
without opening another tool:

- What should I work on today?
- How many tickets did I plan?
- How much of today's plan is complete?
- Which tickets are waiting for a response or external change?
- Which meetings do I have today?

At the end of a workday, the user should be able to capture new tickets, close
out today's work, review follow-ups, and prepare the next workday in one guided
ritual.

## Product principles

### Today before inventory

The default destination is Today, not the full ticket list. Unplanned work must
remain available through search and a secondary action without competing for
attention.

### Deliberate planning

North Haven never silently rolls work into another day. It may suggest the next
workday and a useful sort order, but the user explicitly selects every planned
item.

### Calm over urgency theater

Use muted color, restrained notifications, plain language, and progressive
disclosure. Red is reserved for destructive actions or true errors, not normal
work that is late or waiting.

### One meaning per status

Ticket workflow status, long-term tracking state, and daily execution state are
separate. A resolved ticket can remain under observation and can be finished in
today's plan without being fully closed.

### Actual work creates history

Calendar summaries and insights are derived from work logs and confirmed
outcomes, not from intention alone.

### Assistance without judgment

Capacity guidance is descriptive. North Haven can say that a plan exceeds the
user's usual range, but it never assigns a productivity grade or blocks the
plan.

## Current workflow semantics

- **Resolved:** the user's WordPress work is complete.
- **Watching:** the ticket remains visible while a coworker completes temporary
  downstream changes to new forms.
- **Closed:** all downstream work has been confirmed complete.

The data model uses generic follow-up concepts rather than hard-coding the
temporary WordPress/form process.

## Goals

- Reduce morning decision-making and context switching.
- Create a reliable end-of-day planning habit.
- Preserve visibility of resolved work that still needs external follow-up.
- Make manual ticket entry fast enough to use every day.
- Produce a useful monthly record of actual work.
- Keep operational statistics out of the primary daily experience.
- Protect customer information and calendar credentials.

## Non-goals for the MVP

- Replacing the source ticket system.
- A Kanban board or Jira-style workflow.
- Automatic ticket import.
- Team collaboration or assignments.
- Editing Google Calendar events.
- Native mobile applications.
- AI-generated schedules.
- Advanced recurring tasks.
- Gamification, mascots, or productivity scores.

## Success measures

Product success should initially be evaluated through behavior and usability,
not volume alone:

- A prepared plan exists before at least 80% of normal workdays.
- The morning plan can be understood within ten seconds.
- End-of-day review can normally be completed within ten minutes.
- No ticket marked Watching is lost before it is Closed or Archived.
- Manual creation of a routine ticket takes less than thirty seconds after the
  user becomes familiar with the form.
- Calendar summaries distinguish planned work from actual work.

## Shared vocabulary

- **Work inventory:** every active, watching, closed, or archived work item.
- **Daily plan:** the finite set selected for one date.
- **Work item:** a ticket, task, reminder, or local meeting record.
- **Worked ticket:** a ticket with a work log or confirmed daily outcome during
  the selected period.
- **Resolved ticket:** the user's portion was completed during the selected
  period.
- **Closed ticket:** all downstream work was confirmed complete during the
  selected period.
- **Plan completion:** completed daily plan items divided by actionable planned
  items.
- **Next workday:** the next Monday-Friday date that is not OOO or manually
  marked non-working.


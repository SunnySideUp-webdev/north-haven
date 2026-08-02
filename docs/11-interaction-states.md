# Interaction states

Status: Approved  
Last updated: July 31, 2026

This specification completes the high-fidelity visual direction by defining
what North Haven says and does when content is absent, delayed, invalid, or
temporarily unavailable. The companion visual board is
`design/high-fidelity/screens/09-system-states.svg`.

## Principles

1. Preserve the user's work. A failed save or validation error must never
   silently discard entered information.
2. State the consequence, not only the technical condition.
3. Offer one clear next action and keep secondary actions quiet.
4. Google Calendar may improve planning but may never block it.
5. Use calm language and restrained color. Red is reserved for information
   requiring correction or attention, not for creating alarm.
6. Avoid success confetti, streaks, scores, and other gamification.

## Empty states

| Context                        | Primary copy                                           | Primary action          | Behavior                                                         |
| ------------------------------ | ------------------------------------------------------ | ----------------------- | ---------------------------------------------------------------- |
| Today has no plan              | `Your day is still open.`                              | `Plan this day`         | Opens Plan on the selected date.                                 |
| Work inventory is empty        | `No work has been added yet.`                          | `Add your first ticket` | Opens the ticket form.                                           |
| No matching search results     | `No work matches these filters.`                       | `Clear filters`         | Preserves the search text until explicitly cleared.              |
| Insights has no completed days | `Your patterns will appear after you close a workday.` | `Return to Today`       | No fake or placeholder metrics are shown.                        |
| Calendar is disconnected       | `Continue without Google Calendar.`                    | `Add a meeting`         | Manual tickets, tasks, reminders, and meetings remain available. |

## Loading and saving

- Initial page loading uses structural skeletons with no flashing spinners.
- A local field save uses `Saving changes…`, followed by `Saved` only when the
  confirmation is useful. Routine autosaves may return to a neutral state.
- Buttons preserve their width while saving to prevent layout movement.
- Submitting a form disables only the affected action, not global navigation.
- If a request lasts longer than ten seconds, show a calm retry message while
  retaining the user's input.
- Previously loaded Calendar events remain visible with a stale label while a
  background refresh is attempted.

## Validation and save failure

- Validate fields on blur and again on submit.
- Place the message immediately below the affected field and move focus to the
  first invalid field after submit.
- Do not erase valid fields when another field is invalid.
- Ticket-number message: `Enter the number exactly as it appears in the ticket system.`
- Required-field message: `Add a {field name} to continue.`
- Date-order message: `Resolution date cannot be earlier than the received date.`
- Save failure: `We couldn't save these changes. Your information is still here.`
- Primary recovery action: `Try again`.

## Possible duplicate ticket

Ticket number is the primary duplicate signal. When an existing number is
found, display the existing ticket title, operational status, and tracking
state before creating another record.

- Primary action: `Open existing ticket`
- Secondary action: `Save as a separate ticket`
- The second action requires an explicit choice but not a destructive warning.
- Never place customer note content in the duplicate-check URL or logs.

## Google Calendar states

| State                   | Message                                                                                    | Available action                             |
| ----------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Connected and current   | `Google Calendar connected` and relative sync time                                         | `Manage connection`                          |
| Syncing                 | `Checking for calendar updates…`                                                           | Continue using all local features            |
| Stale                   | `Calendar has not synced since {time}. Meetings may be out of date. Planning still works.` | `Try again` or `Reconnect`                   |
| Disconnected            | `Calendar may be out of date. Manual planning continues normally.`                         | `Connect Google Calendar`                    |
| Corporate access denied | `Your organization did not allow this connection.`                                         | `View setup help` and continue manually      |

The application shows the last successful sync time. A stale or disconnected
calendar never changes locally entered work or blocks End of Day.

## Out of Office

- A full-day Google `outOfOffice` event marks the date as non-working. This
  includes provider all-day records and exact local midnight-to-midnight
  intervals, but not partial OOO blocks.
- Plan navigation includes the date and keeps every planning control available.
- The OOO message is informational and does not require confirmation.
- Adding, editing, reordering, or marking a plan Ready does not remove or alter
  the Google event.
- End of Day still skips OOO when proposing the next required workday plan.

## Capacity reminder

At nine actionable items, show:

> Tomorrow already has 9 actionable items. A smaller plan may feel more manageable.

The reminder is informational. It never disables selection or saving. Meetings
do not count as actionable items; tickets, tasks, and reminders do.

## Confirmation dialogs

Confirmation is reserved for changes with meaningful lifecycle or data impact:

- Closing a watched ticket
- Archiving a work item
- Disconnecting Google Calendar
- Leaving End of Day with unsaved form changes

The title names the affected object and the body explains the result. The safe
action is first; the confirming action repeats the verb. Routine status edits,
planning selections, and reversible field changes do not use dialogs.

## End of Day completion

The completion state confirms three outcomes without introducing a score:

- What was completed today
- Whether every waiting item has a review date
- What has been deliberately planned for the next workday

It shows the next day's first focus and first meeting, provides `Review
Monday's plan`, and ends with `Return to Today`. The state remains editable and
records the completion time. No confetti, badges, or streaks appear.

## Accessibility and implementation acceptance

- Status is never communicated by color alone.
- Loading and save results use an appropriate polite live region.
- Validation errors are programmatically associated with their inputs.
- Focus is restored predictably after dialogs close.
- All actions remain keyboard accessible and show a visible focus indicator.
- Reduced-motion settings disable nonessential transitions.
- Stale Calendar events have a text label; visual dimming is supplemental.

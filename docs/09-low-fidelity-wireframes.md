# Low-fidelity wireframe review

## Purpose

This phase tests whether North Haven feels like a prepared workday rather than a
ticket dashboard. Approval should focus on hierarchy, flow, and density. Visual
polish comes in the next phase.

## Shared shell

- Horizontal navigation keeps the application from feeling like an enterprise
  admin tool.
- A broad pastel page band provides the physical-planner character.
- Most screens use one dominant work surface and a quiet context rail.
- The layout assumes a desktop width of at least 1280 px.

## Today

The left rail answers `How much is planned?`, `What is next?`, and `What needs
attention?`. The main surface answers `What should I do?`. Unplanned work is
intentionally absent.

The first planned ticket receives slightly stronger emphasis, but the page does
not force timers or a focus mode.

## Plan

Planning uses three regions:

1. Day context, meetings, and due follow-ups
2. Searchable work inventory
3. The finite selected plan

Selection is manual. Suggested ordering affects only the inventory sort. The
capacity message appears at nine actionable items and does not block Ready.

## End of Day

The initial screen prioritizes quick manual ticket entry because new tickets
must exist before tomorrow can be planned. The four-step progress indicator
makes the ritual resumable and finite.

Later steps reuse existing patterns instead of introducing new page structures:

- Close Today reuses Today rows with an outcome selector.
- Review Follow-ups reuses the Work table with due items only.
- Plan Next Workday embeds the Plan experience.

## Work and Ticket Detail

Work is a table, not a board. Saved views reduce repetitive filtering. Ticket
Detail is a full page rather than a narrow drawer because notes, follow-up,
history, and days worked require sustained reading space.

## Calendar

The monthly grid remains dominant. A left rail follows the reference planner's
composition, while the day summary opens on the right without leaving the
month.

## Insights

Insights is intentionally denser than Today but still restrained. It begins
with plain-language counts, then trends. It never displays a combined
productivity score.

## Settings

Settings uses a secondary left navigation. The Calendar Connection section is
shown because it contains the main external dependency and early technical
risk.

## Review questions

1. Does Today show enough context without exposing the full inventory?
2. Is ticket entry correctly placed as the first End of Day step?
3. Does the three-region Plan screen feel understandable at a glance?
4. Is a full page preferable for Ticket Detail, given the amount of history?
5. Should Calendar Day Summary remain open on the right as shown?

## Approval gate

After the layout direction is approved, the next phase defines final color,
typography, spacing, control appearance, responsive behavior, and interactive
states. Application components should not be implemented from these wireframes
until that visual direction is approved.


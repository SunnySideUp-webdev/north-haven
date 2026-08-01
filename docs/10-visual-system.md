# Visual system — draft for review

The low-fidelity information architecture and wireframes were approved by the
product owner on July 31, 2026. This visual draft preserves those layouts.

## Direction

North Haven combines the spacious composition of a printed planner with the
clarity of a modern desktop application. Lavender establishes the page and
navigation hierarchy. Blush identifies meetings, gentle attention, and
secondary emphasis. Warm white preserves the feeling of paper.

The interface must remain calm during long sessions. Color is used to organize,
not decorate every cell.

## Typography

### Single-family system

**DM Sans** is used throughout North Haven: brand, page titles, navigation,
forms, tables, notes, and metrics. A single sans serif family makes the product
more minimal and lets spacing, scale, and weight create the hierarchy.

- Brand and page titles: 700–800 weight
- Section titles and primary controls: 600–700 weight
- Body and table content: 400–500 weight
- Metadata and labels: 500–700 weight with restrained letter spacing

Fallback: Arial, Helvetica, sans-serif.

Italic styling is not part of the core visual language. It may appear only when
semantically required by user-authored content.

## Color tokens

### Foundation

- Canvas: `#FBF9F8`
- Paper: `#FFFEFC`
- Ink: `#403A44`
- Muted ink: `#756E79`
- Quiet ink: `#96909A`
- Border: `#DDD7DF`

### Lavender

- Lavender 50: `#F6F3F8`
- Lavender 100: `#ECE7F1`
- Lavender 200: `#DCD4E6`
- Lavender 300: `#C4B8D6`
- Lavender 500: `#82709C`
- Lavender 700: `#584A6B`

### Blush

- Blush 50: `#FFF7F6`
- Blush 100: `#F8E6E6`
- Blush 200: `#F0D3D6`
- Blush 300: `#E4B6BD`
- Blush 600: `#995C67`

### Semantic

- Success surface: `#E6EEE7`
- Success ink: `#47604D`
- Waiting surface: `#F4EAD7`
- Waiting ink: `#735D35`
- Urgent surface: `#F8E0E3`
- Urgent ink: `#8A4350`
- Error: `#A93E4E`
- Focus ring: `#8B78A8`

Pastel backgrounds always use dark text. Semantic meaning is repeated in text,
not communicated through color alone.

## Spacing and shape

- Base spacing unit: 4 px
- Primary page gutter: 32–40 px
- Section spacing: 24 or 32 px
- Control height: 40–44 px
- Primary action height: 48 px
- Table row height: 56–64 px
- Radius: 8 px controls, 12 px surfaces
- Borders: 1 px; shadows are avoided except for temporary overlays

## Page composition

- Sticky navigation: 72 px
- Editorial page band: 132–152 px
- Context rail: 264–288 px
- Dominant content surface: remaining width
- Maximum useful canvas: approximately 1440 px

## Controls

### Primary button

Lavender 300 background, Lavender 700 text, 1 px Lavender 500 border. Hover
darkens the background slightly. Focus uses a 3 px external focus ring.

### Secondary button

Paper background with Border. It must not compete with the page's single
primary action.

### Inputs

Paper or Canvas background, 1 px Border, 8 px radius, persistent visible label.
Placeholder text never replaces the label.

### Checkboxes

Square with slightly rounded corners for tasks and tickets. Completed states use
Success colors. Meeting attendance uses a labeled status instead of a checkbox.

### Status labels

Compact text pills are reserved for Urgent, High, Waiting, Watching, and OOO.
The common Medium priority is usually plain metadata.

## Tables

- Blush 100 header band
- Dark, small uppercase labels
- Warm paper rows with separators rather than individual cards
- Hover uses Lavender 50
- Selected rows use Lavender 100 and a Lavender 500 leading edge
- Sticky header for long inventories

## Calendar

- Weekday header: Blush 100
- Standard day: Paper
- Selected day: Lavender 100
- OOO day: Lavender 200 with an explicit `OOO` label
- Weekend: Canvas with reduced emphasis
- Day Summary: opaque Paper overlay with a subtle border and small shadow

## Reports

- The Report Builder uses the standard application shell and keeps Insights
  active in navigation.
- PDF reports remove navigation and interactive controls.
- Report pages use Paper with a narrow Blush 200 top rule.
- Summary metrics alternate Lavender 50 and Blush 100 surfaces.
- Charts use Lavender 300 for Worked and Blush 200 for Resolved, always paired
  with visible labels and a plain-language summary.
- `Private work summary`, period, time zone, generated time, and page number use
  quiet uppercase or metadata treatments.
- Multi-page detail sections repeat the report title and period in a restrained
  running header.
- Reports remain useful in grayscale and never rely on background color alone.

## Motion

- 140–180 ms for hover, selection, and disclosure
- 200–240 ms for the Day Summary panel
- No bouncing, celebration, or continuous animation
- Respect reduced-motion preferences

## Accessibility

- Target WCAG AA for normal text and controls.
- Never place light gray text on lavender or blush.
- Focus is visible on every interactive element.
- Minimum pointer target: 40 by 40 px.
- Charts include labels and plain-language summaries.
- The experience remains complete if the custom sans serif font cannot load.

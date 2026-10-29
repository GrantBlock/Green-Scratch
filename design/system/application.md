# Concepts Hub and Concepts Vault

Rules for the application: Concepts Hub (public tools) and Concepts Vault (private admin). Both use the `dark` theme. Everything in the brand book still applies: Steel Blue is the only blue, shapes are square and flat (radius 4px at most, no shadows, no gradients), Overpass and Overpass Mono, 44px targets, a 2px `bc-steel-blue-text` focus outline, reduced motion respected, and the copy rules. The app also uses no icon set beyond the small stroke icons built into the components.

## Forms

- Every control has a visible label above it (`TextField`, `SelectField`, `TextArea`, `FileDrop`, `Checkbox`, `Radio`, `SearchField`). Placeholder text is never the label.
- Controls are 44px tall with a `bc-control-border` outline (3:1 or better on every surface), 16px text and a 2px focus outline. Hover brightens the border; disabled controls are dashed and dimmed; errors turn the border and message `bc-feedback-error-text` and add an icon.
- Only the email field validates its format, on blur. Every other field accepts what is typed; report anything else with the `error` prop after submit.
- Radios and badges are square, because nothing in the system has a radius over 4px.

## Navigation lists

- `TabBar`: a fixed set of tabs on one row that share the width and scale their type to fit; use six or fewer with one- or two-word labels. The Vault uses exactly Log List, Releases, Directory, Customers, Settings, Registry.
- `ListBox`: a single-select list, active row solid Steel Blue, its own scroll area, optional labelled search above it. `ButtonColumn`: stacked buttons with one selected and, at most, one private login button set apart at the bottom.

## Status colors

Status colors are defined, restrained and used only for state. Each state has a text color, a tint and a hairline (`bc-status-*`, `bc-build-*`, `bc-feedback-*`), built from five tones (`bc-tone-neutral`, `blue`, `amber`, `red`, `green`). Text on its tint is 5.78:1 or better in both themes. State is always shown with its label and a marker, never by color alone.

| Group | State | Tone | Marker |
| --- | --- | --- | --- |
| Status | New | blue | open square |
| Status | Contacted | neutral | half-filled square |
| Status | Quoted | amber | three-quarter square |
| Status | Closed | neutral | full square |
| Build State | Quoting | neutral | one-sixth square |
| Build State | Designing, Purchasing, Manufacturing, Assembling | blue | two- to five-sixths square |
| Build State | Completed | green | full square |
| Feedback | error | red | square with a cross |
| Feedback | warning | amber | triangle |
| Feedback | success | green | check mark |
| Feedback | info | blue | circled i |

Red and green appear only for error, success and Completed. Use `StatusPill` to show a state and `StatusSelect` to edit it inline; Build State is a dropdown of the six values in order.

## Screens and layouts

- **Log List** (Vault): `LogTable` inside `VaultShell`. The first two columns filter, every column sorts, rows select, the file column shows a PDF first-page thumbnail, and each row has Open and Archive. Edits to Build State stage into `StagedBar`; Apply and Archive ask `ConfirmDialog` first.
- **Grab this**: `GrabLayout` with `TabBar`, two `ListBox` columns and `DetailPane`. On phones the lists show together as a two-column menu and picking an entry shows the detail full width.
- **Fix this**: `FixLayout` with a `ButtonColumn` and a content area; the buttons stack above the content on phones.
- **Build this**: `WelcomeScreen`, then `StepRail`, `ConfigBar`, `StationCard`s with `AddStation`, and `LayoutPreview`, arranged with `BuilderLayout` (form left, preview right).
- **Ask this**: `ChatWindow`, with the "AI assistant, not a binding quote." notice always visible.
- Empty, loading and error states use `StateMessage`; confirmations and saves use `Toast`.

## Pattern by screen type

One line pattern per view, never behind running text, tables or forms.

| Screen | Pattern |
| --- | --- |
| Hub home and Welcome screen (Build this) | `assets/Patterns/lines-top-right.png` |
| Private login and full-page empty states | `assets/Patterns/lines-bottom-left.png` |
| Log List, Releases, Directory, Customers, Settings, Registry | none |
| Grab this, Fix this, Build this steps, Ask this | none |
| Drawing sheets and Word documents | none on the sheet; Word pages use `assets/Documents/` |

## Copy

Buttons name the action ("Archive", "Apply (3)", "Reload Past Configuration"). Errors say what went wrong and how to fix it. Confirmations name the item and how to undo. Never name suppliers, customers or locations in anything a visitor sees; registry numbers (BC-…) appear only inside the Vault.

# Design system: where it lives and what it must cover

The Block Concepts design system is authored in Claude Design and is the **only** source of branding for the Hub, the Vault and every tool (`spec/system-architecture.md`, "Design Tokens").

## Export location

- `design/system/` holds the export: a tokens file (CSS variables or JSON), the component reference and any fonts or logo assets.
- Code imports the tokens file. Nothing else defines colors, fonts or spacing.

## What the design system must include

1. **Tokens:** color roles (text, surface, accent, accent-on-surface, focus, danger, success), type scale and families, spacing, radius. Themes: whichever you choose (light, dark, or both).
2. **Components:** top tab bar, vertical selectable list, search box with label, detail pane, form fields and validation, buttons (primary, secondary, dashed add), table, status pill (New, Contacted, Quoted, Closed), build-state dropdown, step rail, modal, toast.
3. **Layouts:** the Fix this 1/5 + 4/5 column layout; the Grab this four-zone drill-down; the Vault tab shell; the two-column builder with sticky preview.
4. **Print / drawing:** sheet sizes (ANSI A landscape and portrait), line weights, label type, double-line border, title block with proprietary notice, tolerance notes, company block, drawing number, version, scale, "Sheet X of N".
5. **Brand assets:** logo, favicon.
6. **Accessibility:** contrast checked to WCAG 2.1 AA in each theme.

## Rule for everyone

If a screen needs something the design system does not have, add it to the design system first, then use it. Do not define it locally.

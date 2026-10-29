# Design system: status, coverage and gaps

The Block Concepts design system was authored in Claude Design and is exported into `design/system/`. It is the **only** source of branding for the Hub, the Vault and every tool (`spec/system-architecture.md`, "Design Tokens"). Read `design/system/README.md`, then `website.md` (screens) or `word-documents.md` (documents).

## What it provides

- **Tokens:** `tokens.css` and `tokens.json`. Two themes: `dark` (website) and `light` (documents). Spacing on a 4px grid, radius 0/2/4px, Overpass, Overpass Mono, Aptos (Word only).
- **Components** (`components/`, load `bundle.css` + React 18 + `bundle.js`, globals on `window.BlockConcepts`): NavBar, PillarPanels, Statement, SolutionTile, TierRow, CredibilityBand, CtaBand, Footer, CookieBanner, RenderPlaceholder, Button (primary, secondary, link), Wordmark, Callout, Stage, DataTable.
- **Assets:** logo mark (print, dark, reversed), corner line patterns, Word page art, fonts.
- **Rules:** content and copy fundamentals, logo use, motion, focus, and Word document specs.

## Gaps this app needs filled (add to the design system first, then use)

| # | Needed | Used by | Note |
|---|---|---|---|
| 1 | Form controls: text input, select, textarea, file input, checkbox, labelled search box, validation and error states | Give this, Build this, Vault forms, Grab this search | Radius 2px per system rules. |
| 2 | Tab bar (horizontal) and vertical selectable list with active state | Grab this, Vault tab bar, Fix this column | Active = Steel Blue; 44px targets. |
| 3 | Status colors | Log List Status (New / Contacted / Quoted / Closed), Build State, form errors | The system says "Status colors are not defined yet" and bans decorative red and green. Needs a decision. |
| 4 | Status pill and build-state dropdown | Log List | Can reuse tag styles once status colors are decided. |
| 5 | Step rail, config bar, station card, sticky preview panel | Build this | Not in the system. |
| 6 | Detail pane with preview image, revision selector, expand button | Grab this | Not in the system. |
| 7 | Modal / confirm, toast, empty states | Vault, Grab this | Not in the system. |
| 8 | Chat window | Ask this | Not in the system. |
| 9 | Engineering **drawing sheets** (ANSI A landscape and portrait): line weights, double-line border, label type, title block (proprietary notice, tolerance notes, company block, drawing number, version, scale, "Sheet X of N") | Build this output | The system covers US Letter Word documents only. Print on the `light` theme. |
| 10 | Font for generated PDFs | Build this output | Decided: the PDF sheets use Overpass (shipped by the system); the Word document uses Aptos. Confirm the system documents this. |

## Decisions made

1. **Vault theme:** `dark`, same as the Hub.
2. **Hub navigation:** the Hub has its own header at `/tools` using the system's NavBar style. Grant adds a **Tools** section to the live website at release; the website says nothing about the Hub until then.
3. **Section names:** the website is the single source of truth (Engineering, Sourcing, Services). Develop this stays as a Hub section but will be re-specified with its own detail and must not overlap the pillars.
4. **Process document format:** Build this produces both the PDF drawing sheets and the Word process document.

## Still open

- Gap 3 (status colors) and the other gaps above.
- Who this: what it holds, since the website already has About.
- Whether the Word document is part of the free Preview tier.

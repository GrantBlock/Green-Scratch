Block Concepts is a specialty automation company: one accountable source from the first conversation to a running system, for small fixes and full machines alike. The brand is plain, engineered and exact. This system builds two things: the public website (dark theme, Overpass) and customer-facing Word documents (light theme, Aptos). Read `website.md` before building a page, `word-documents.md` before building a document, `application.md` before building Concepts Hub or Concepts Vault, and `print-drawings.md` before building a drawing sheet.

## Content fundamentals

- Speak as Block Concepts, with "we" or the company name. Never first-person singular. Address the reader as "you" and "your": your line, your team, your equipment.
- Name the company "Block Concepts" in running text and "Block Concepts LLC" in legal lines. BLOCK CONCEPTS in capitals appears only in the wordmark.
- "One accountable source" is the recurring brand line. "Specialty automation" is the category label. Real examples: "Small fixes and full production lines. One accountable source." / "Bring us your problem. One accountable source from start to finish." / "We establish what problem the system is addressing before a solution can be created."
- Write concretely for a plant or operations lead who will sign off a capital project: what is decided, what is delivered, what it costs. Every claim names the deliverable or the commitment behind it.
- Website headlines are uppercase. Document headings are Title Case and often a plain question: "Why Block Concepts?", "Where Does Cost Become Formal?", "How to Proceed?". Stage headings read "Stage 1 — Assessment".
- Give numbers as they appear in the work: "$125/Hr", "RAD Index 1 to 5", "65% of specification", "FAT", "SAT". Spell out an acronym on first use.
- No emoji, no exclamation marks, no superlatives. Never name suppliers, brands, customers, locations or proprietary dimensions; use descriptors such as "a dispensing manufacturer".
- Document numbers follow `BC-Q-YYNNN`. Registry numbers (BC) are internal and never shown publicly.

## Visual foundations

- **Two themes, both in `tokens.json`.** `dark` is the website (near-black `bc-surface`, white `bc-ink`). `light` is documents and proposals (white `bc-surface`). Set `data-theme="dark"` on `<html>` for the website.
- **Steel Blue `bc-steel-blue` is the only brand blue**, about 10 to 20 percent of a layout. On the website it is the wordmark's BLOCK, buttons, tags, progress bars, rules and the open-panel name. Website headlines stay `bc-ink`; in Word documents headings are blue (`bc-mark-print`).
- **Blue text under 24px is `bc-steel-blue-text`**, never `bc-steel-blue` on raised or white grounds. Links, eyebrows, pillar labels, tag text and focus rings use it.
- **`bc-wordmark-gray` is for CONCEPTS in the wordmark only.** Secondary text is `bc-muted`.
- **No gradients, no other blues, no decorative red or green.** The only gradients are the diagonal stripes on image placeholders and the dark scrim under text on tiles and pillar panels. Status colors are not defined yet.
- **Type.** The website sets everything in Overpass (`font-sans`), labels and tags in Overpass Mono (`font-mono`), both shipped as files in `fonts/`. Documents use Aptos (`font-doc`), which Word supplies; it is not a web font. Headlines are weight 800, uppercase, `-0.01em` tracking, line height 0.95 to 1.0. Body is 17 to 19px at line height 1.6, 65 characters wide at most. Navigation and links are weight 500, uppercase, 0.04 to 0.06em tracking. Labels are mono 500, 11 to 13px, uppercase, 0.12em tracking.
- **Shape.** Square and flat: `bc-radius-sm` (2px) on buttons and inputs, `bc-radius-md` (4px) on callouts and document panels, `bc-radius-none` everywhere else on the website. Nothing exceeds 4px. No shadows; separate surfaces with `bc-surface-raised` and `bc-hairline`.
- **Spacing.** `bc-space-*` on a 4px grid. Website gutter is 20px on phones and 48px on desktop, content maximum 1320px, sections 80 to 170px apart.
- **Pattern.** The brand's motif is diagonal hairlines in a corner: dashed lines are concept and solid lines are build, so the dashes turn solid as they run toward the corner. Use `assets/Patterns/lines-top-right.png` as the main graphic at 50 percent opacity, `lines-bottom-left.png` as the secondary corner. One pattern per view, never behind running text. Word documents use the page art in `assets/Documents/`.
- **Imagery.** Pillar panels and solution tiles use AI-generated CAD-style model renders on a neutral ground. Until a render exists, show `RenderPlaceholder`. Customer photos only when shared under a confidentiality agreement and approved.
- **Focus and targets.** A solid 2px `bc-steel-blue-text` outline with 2px offset; interactive targets at least 44px.
- **Motion.** Short and functional (a 250ms chevron turn, a 300ms scrim change). Respect `prefers-reduced-motion`; no autoplay carousels.

## Logo

- The master mark is `assets/Logos/block-concepts-mark.svg`: a circle around a hexagonal block with a chevron, single ink `bc-mark-print`. Use the file, never redraw it. On the dark website use `block-concepts-mark-dark.svg` (`bc-steel-blue`); on Steel Blue panels or photos use `block-concepts-mark-reversed.svg` (white).
- The wordmark is BLOCK in `bc-steel-blue` weight 700 and CONCEPTS in `bc-wordmark-gray` weight 300, caps, one line, tracking 0.08em on the website, set in Overpass. On desktop the header adds a divider and "Specialty Automation"; on phones the tagline is hidden. Use the `Wordmark` component until a master wordmark file exists. In Word documents the cover shows the mark above the wordmark.
- Minimum width 120px on screen, 32mm in print. Clear space equals the cap height, 16px at least. Do not swap the two word colors, set both words in one weight, stretch, outline, add shadows, or put the primary version on Steel Blue (use reversed).

## Using the components

Load `tokens.css` and `components/bundle.css`, then React 18 and `components/bundle.js`; components live on `window.BlockConcepts`. Website: `NavBar`, `PillarPanels`, `Statement`, `SolutionTile`, `TierRow`, `CredibilityBand`, `CtaBand`, `Footer`, `CookieBanner`, `RenderPlaceholder`, `Button`, `Wordmark`. Document patterns: `Callout`, `Stage`, `DataTable`.

## Application components (Concepts Hub and Concepts Vault)

Both apps use the `dark` theme and the same components bundle. Rules are in `application.md`; drawing sheets are in `print-drawings.md`. Components by area:

- **Forms:** `TextField`, `SelectField`, `TextArea`, `FileDrop`, `Checkbox`, `Radio`, `SearchField`.
- **Navigation lists:** `TabBar`, `ListBox`, `ButtonColumn`.
- **Status:** `StatusPill`, `StatusSelect` (tokens `bc-status-*`, `bc-build-*`, `bc-feedback-*`, built on `bc-tone-*`).
- **Tables and panes:** `LogTable`, `PdfPreview`, `DetailPane`.
- **Layouts:** `GrabLayout`, `FixLayout`, `VaultShell`, `BuilderLayout`.
- **Feedback and overlays:** `Modal`, `ConfirmDialog`, `Toast`, `StateMessage`, `StagedBar`.
- **Station builder:** `StepRail`, `ConfigBar`, `StationCard`, `AddStation`, `LayoutPreview`, `WelcomeScreen`.
- **Chat:** `ChatWindow`.
- **Print drawings:** `DrawingSheet`, `StationBox`, `DrawingLine`, `FlowArrow`, `DrawingLegend`, `ScheduleTable`, `ProcessList`.

Pattern per screen: top-right lines on Hub home and the builder's welcome screen, bottom-left lines on the private login and full-page empty states, none on working screens. Favicons are in `assets/Favicons/`.

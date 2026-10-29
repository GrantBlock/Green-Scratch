# Prompt for the design-system session: add what the app needs

Paste everything below the line into the Claude Design session that built the Block Concepts design system. After it finishes, re-export and replace the contents of `design/system/` in this repo.

---

Extend the Block Concepts design system to cover a new app: Concepts Hub (public tools) and Concepts Vault (private admin). Both use the `dark` theme. Keep every existing rule: Steel Blue is the only blue, square flat shapes (radius at most 4px), no shadows, no gradients, Overpass and Overpass Mono, 44px targets, 2px `bc-steel-blue-text` focus outline, prefers-reduced-motion respected, and the copy rules. Do not change existing tokens or components. For each addition provide a component folder with `README.md` and `preview.html` in the same format as the existing ones, add tokens to `tokens.json`/`tokens.css`, rebuild `bundle.js`/`bundle.css`/`index.d.ts`, and update the main `README.md`.

## 1. Form controls
Text input, email input, select, textarea, file input (drag area plus button), checkbox, radio, labelled search box. States: default, hover, focus, disabled, error with message, filled. Labels are always visible (never placeholder-only). Only the email field validates format.

## 2. Navigation lists
- Horizontal **tab bar**: one active tab, fixed count that auto-scales to fit (no wrapping or scrolling), keyboard operable, ARIA tablist.
- **Vertical selectable list** (listbox): active row highlighted in Steel Blue, scrolls independently, keyboard operable, with an optional search box above it.
- **Button column**: a 1/5-width column of stacked buttons (Fix this) with one selected state and one visually distinct button for the private login.

## 3. Status colors
The system says status colors are not defined. Define a restrained set, still no decorative red or green, that stays legible on the dark and light themes and passes WCAG 2.1 AA, for:
- Status: New, Contacted, Quoted, Closed
- Build State: Quoting, Designing, Purchasing, Manufacturing, Assembling, Completed
- Feedback: error, warning, success, info
Each needs a text color, a tint background and a hairline. State must never rely on color alone (also use a label or marker).

## 4. Status pill and dropdown
A pill using the status tokens, and a dropdown that edits it inline in a table row (Build State is a dropdown of six values).

## 5. Log List table
Extend DataTable for a dense admin list: sortable and filterable column headers (the first two columns are filters), row selection, an inline file column that shows a PDF first-page preview, row actions (archive, open), sticky header, and a compact row height that still keeps 44px click targets.

## 6. Detail pane (Grab this)
A 3/5-width pane with: first-page preview image with alt text, title, description, "When to use" block, download button, a **revision selector** in the top-right corner (up to 3 revisions, latest by default), and an **expand button** in the top-left corner that makes the pane full width. Include empty states for "nothing selected".

## 7. Layouts
- **Grab this four-zone drill-down:** tab bar on top, then 1/5 + 1/5 + 3/5 columns on desktop. On phones the first two columns show together as a full-width two-column menu, and selecting an entry switches to a full-width detail view.
- **Fix this:** 1/5 button column plus 4/5 content area; collapses to a stacked menu on phones.
- **Vault shell:** header plus the six-tab bar (Log List, Releases, Directory, Customers, Settings, Registry) and a content area.
- **Two-column builder:** left scrolling form, right sticky preview.

## 8. Feedback and overlays
Modal and confirm dialog (for archive and apply), toast, inline empty states, loading and error states, and a **staged-changes bar** with an Apply button that shows how many changes are pending.

## 9. Station builder (Build this)
- **Step rail:** numbered circles marked active and done.
- **Config bar:** a labelled Config Number field, a Reload Past Configuration button, Back and Next.
- **Station card:** numbered badge, editable station name, flow tag, remove (×) button, and fields: Station Type, Speed, Parts/Cycle, Length, Width, Air, Electrical, and a Flow Direction dropdown (Left → Right, Right → Left, Vertical).
- **Add station:** a dashed add button.
- **Layout preview panel:** an 11 × 8.5 gridded overhead drawing area with a "Proposed Operation Order" card beneath it.
- **Welcome screen:** near-black surface with the corner line pattern, the Block Concepts pill, a large heading, one line of text and a Start button.

## 10. Chat window (Ask this)
Message list with visitor and agent messages, a streaming-in state, a composer with send button, an error state, a contact-handoff prompt, and a fixed notice line ("AI assistant, not a binding quote").

## 11. Engineering drawing sheets (print)
A print section for **ANSI A (11 × 8.5 in) landscape and portrait** sheets, `light` theme, white ground, Overpass for PDFs:
- Line weights for object, hidden, center and dimension lines; a flow arrow; a numbered station tag; a tentative-item style (dashed); one highlight color for the pick-and-place station using Steel Blue.
- Classic **double-line border** with margins.
- **Title block:** proprietary notice, tolerance notes, company name with email and phone, title, date, size, version, scale, drawing number, "Sheet X of N". The drawing number appears at the top left next to the logo.
- A schedule table style and a numbered-list style for the process description sheet.
- Rules for the control-cabinet box and station boxes (label contents: name, type, L × W, speed).

## 12. Word document additions
Keep `word-documents.md` and add: a **process document** template section (station schedule table, sequence of operation as a numbered list, utilities summary table, layout figure placement) using the existing Word styles, Aptos, US Letter.

## 13. Assets and notes
- Favicon set from the mark.
- A short note on which pattern (`assets/Patterns/`) to use on each new screen type, one per view.
- Add to the README a list of the new components so the app can discover them.

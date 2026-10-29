# Word documents

How to build customer-facing Word documents (proposals, process documents, quotes, packets). The current RAD Process document is the reference. It uses the light theme, Aptos and the page art in `assets/Documents/`.

## Page and styles

| Element | Specification |
| --- | --- |
| Page | US Letter, 1 inch margins on all sides, header and footer 0.5 inch |
| Font | Aptos for all text (Word supplies it); fall back to Calibri |
| Body | 10.5pt, `bc-doc-ink` (black), 6pt space after, line spacing 1.04 |
| Heading 1 | 20pt, `bc-mark-print` (#2F5D80), 18pt before, 4pt after, keep with next |
| Heading 2 | 16pt, `bc-mark-print`, 8pt before, 4pt after |
| Stage and packet headings | 11.5pt bold, `bc-doc-ink` ("Stage 1 — Assessment"); the one-sentence purpose follows in body text |
| Bullets | Body size, 0.25 inch indent, standard bullet |
| Milestone cost note | Body size; the lead-in "Cost at this milestone:" in bold |
| Confidentiality notice | 9pt italic, `bc-doc-secondary` (#595959), on the cover page |
| Header and footer | Footer reads "Block Concepts · Document name · Page N" centered, 9pt, `bc-doc-secondary` |

## Cover page

Centered, top to bottom: the mark (`assets/Logos/block-concepts-mark.png`), the wordmark BLOCK in bold and CONCEPTS in light weight, both in `bc-mark-print`, the descriptor "Automation Development · Systems Engineering · Custom Project Delivery" in `bc-doc-secondary`, the title (34pt bold, `bc-mark-print`), the subtitle (17pt, `bc-mark-print`), a one-sentence summary (13pt, `bc-doc-secondary`), "Prepared and Executed by Grant Block" and the contact email, then the confidentiality notice. The page art with both corners (`page-art-both-corners.png`) sits behind the cover, anchored to the page.

## Pages after the cover

Place `page-art-bottom-left.png` as a full-page picture behind text in the header so the line pattern appears in the bottom-left corner of every page. Body content sits within the margins and never over the pattern.

## Tables

- Header row: fill `bc-doc-table-header` (#4A7BA7), bold white text.
- Body rows alternate white and `bc-doc-table-zebra` (#F2F2F2); text `bc-doc-ink`.
- Borders: single, 0.5pt, `bc-doc-rule` (#D9D9D9), all inside and outside edges.
- Give each table a bold 11pt title above it ("Stage Summary", "Risk Rating [RAD Index]"). Set codes and index numbers in the first column.

## Structure and voice

- Open with Overview, then Why Block Concepts?, then the process, then cost and commitment, then deliverables, then How to Proceed? Headings are Title Case and often a question.
- Each stage states what is decided, what is delivered and what commercial commitment is made. Name the packet and what the reader's sign-off releases.
- Proposals and quotes carry the document number `BC-Q-YYNNN` next to the logo at top left.
- The brand guide's light tokens (`bc-ink` #1B2229, `bc-steel-blue` headings, `bc-steel-blue-tint` table headers) apply to documents the Word reference does not cover, such as slides and letterhead. Where the RAD Process document and the brand guide differ, follow the document for Word files.

## Colors for code

| Use | Hex |
| --- | --- |
| Headings, wordmark, cover title | 2F5D80 |
| Table header fill | 4A7BA7 |
| Table zebra fill | F2F2F2 |
| Table borders | D9D9D9 |
| Body text | 000000 |
| Secondary text, notice | 595959 |

Pictures: `assets/Logos/block-concepts-mark.png` (2000px, transparent), `assets/Documents/page-art-bottom-left.png` and `page-art-both-corners.png` (full page, white ground, for light documents only).

## Process document template

A process document describes a proposed line: what each station does, how parts move, and what the building must supply. It uses the same Word styles as every Block Concepts document: Aptos, US Letter, 1 inch margins, Heading 1 and 2 in `#2F5D80`, body at 10.5pt, and the standard table style. The cover is the standard cover page.

| Section | Style and content |
| --- | --- |
| Overview | Heading 1, then two or three body paragraphs: the problem, the rate and what the line delivers. |
| Station schedule | Heading 1, then a table titled "Station Schedule" (bold 11pt). Columns: No., Station, Type, L × W (in), Rate, Air (psi), Electrical (V). One row per station in operation order; No. and numeric columns right-aligned. Header row `#4A7BA7` with bold white text, zebra rows `#F2F2F2`, borders `#D9D9D9`. |
| Sequence of operation | Heading 1, then a numbered list in body style: one sentence per step in operation order, the station name in bold, then a dash and the action ("**Pick and place** — the robot moves each part into the torque fixture."). Parts that fail or exit the flow get their own steps. |
| Utilities summary | Heading 1, then a table titled "Utilities Summary". Columns: Utility, Requirement, Notes. Rows: compressed air (pressure and flow), electrical (voltage, phase, total load), and any others the line needs. Same table style. |
| Layout | Heading 1, then the layout figure. Export the drawing sheet's drawing area as a PNG at 300 dpi, place it inline at full text width (6.5 in) on its own page, centered, with no border. The caption sits directly below in 9pt italic `#595959`: "Figure 1 — Proposed layout, [scale]". Refer to stations by their numbers. |
| How to Proceed? | Heading 1, closing paragraph naming the next step and what sign-off releases. |

Keep numbers consistent across the schedule, the sequence and the figure, and mark any tentative station "(tentative)" in the schedule and dashed in the figure.

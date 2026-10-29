# Engineering drawing sheets

Rules for printed and PDF drawings produced by the station builder and by engineers. Sheets are ANSI A, `light` theme, on a white ground, and every word on them is set in Overpass (embed it in PDFs). Use `DrawingSheet` and the drawing components; they carry these rules.

## Sheet

- Size: ANSI A, 11 × 8.5 in landscape or 8.5 × 11 in portrait. Landscape is the default; use portrait for the process description sheet.
- Border: a classic double line. The outer line is 0.6 mm (`bc-line-object`) set 0.25 in (`bc-sheet-margin`) from the sheet edge; the inner line is 0.3 mm (`bc-line-thin`) set 0.08 in (`bc-sheet-border-gap`) inside it. Nothing is drawn outside the border.
- Top left, inside the border: the mark and the drawing number ("Drawing No." label over the number). The drawing number also appears in the title block.

## Title block

A grid along the bottom edge, ruled with 0.3 mm lines under a 0.6 mm top rule:

1. The proprietary notice and the tolerance notes (8pt).
2. The company: Block Concepts LLC, email and phone, set beside them.
3. Title (12pt bold), Date, Size (A) and Version.
4. Scale, Drawing No., and "Sheet X of N".

The wording of the notice and tolerances belongs to each project; the component carries a short default. Dates are written 2026-10-29.

## Lines and symbols

| Element | Rule |
| --- | --- |
| Object line | Solid, 0.6 mm (`bc-line-object`), black |
| Hidden line | Dashed, 0.3 mm, dash and gap `bc-dash-hidden` |
| Center line | Long dash, short dash, 0.3 mm, `bc-dash-center` |
| Dimension line | Solid, 0.3 mm, filled arrowheads, value centered above the line |
| Flow arrow | 0.3 mm line with a filled head, between stations in operation order |
| Station tag | Black square with the station number in white at the box's top-left corner |
| Tentative item | Dashed 0.3 mm outline and the word TENTATIVE below the box |
| Highlight | Only the pick-and-place station: `bc-steel-blue` 0.6 mm outline and `bc-steel-blue-tint` fill |

Line color is black (`bc-doc-ink`); the only color on a sheet is the Steel Blue highlight and the mark.

## Station boxes and the control cabinet

- Each station is a box drawn with an object line, sized to its L × W at the sheet's scale.
- Label inside the box, centered, four lines at most: name (bold, 9pt), type, L × W (for example 30 × 24 in) and speed.
- The control cabinet is a box with a second inner outline 4 units inside the first, labelled "Control cabinet" and its L × W. Connect it to stations with hidden lines for cable and air runs.

## Schedules and process description

- Schedule table (`ScheduleTable`): 8pt text, header row in capitals with a 0.6 mm rule beneath, 0.3 mm cell rules, numbers right-aligned.
- Process description sheet (portrait): a title, then `ProcessList`, a numbered list in operation order, one sentence per step, step name in bold.
- Put `DrawingLegend` on the first sheet of a set.

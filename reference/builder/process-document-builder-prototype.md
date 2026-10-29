# Process Document Builder: prototype description (as received)

Feature: Process Document Builder (Web Builder tool)
Purpose: A customer-facing tool on the Block Concepts site. A visitor lays out a production line one machine at a time, and the tool turns those inputs into a process document on a standard engineering drawing sheet, ready to print or save as PDF.

## Flow (3 screens)

1. **Welcome screen.** A full-screen Steel Blue landing with a faint blueprint grid. It shows a "Block Concepts LLC" pill, a large "Welcome" heading, a one-line explanation, and a Start Building → button.
2. **Step 1: Stations.** A two-column builder.
   - Left: station cards are added in the order product flows. Each card has a numbered badge, a station name you can edit, a flow tag and a remove (×) button. The fields are Station Type, Speed, Parts/Cycle, Length, Width, Air, Electrical, and a Flow Direction dropdown (Left → Right, Right → Left, Vertical ↕). A dashed + Add Station button sits at the bottom.
   - Right: sticky live preview. An 11×8.5 gridded overhead layout redraws as fields change. Below it is a "Proposed Operation Order" card (for example 3 → 2 → 1 → 4) with a short note.
3. **Step 2: Process Document.** Two print-ready sheets plus a Print / Save as PDF button.
   - Sheet 1 (landscape, ANSI A): "Overhead View, Process Layout". The schematic shows a control cabinet (marked tentative), station boxes labeled with name, type, L×W and speed, numbered station tags and flow arrows. The pick-and-place station is drawn in blue.
   - Sheet 2 (portrait): "Process Description". Summary paragraph, a Station Schedule table (#, station and type, speed, L×W, pieces per cycle, air, electrical, flow), a numbered Sequence of Operation and a Utilities Summary (main power, control voltage, air pressure and use, washdown spec).
   - Title block on both sheets: the Block Concepts proprietary notice, tolerance notes, company name with email and phone, title, date, size, version, scale, drawing number and "Sheet X of 3".

Persistent controls: a step rail along the top (numbered circles marked active or done). A config bar with a Config Number field, a Reload Past Configuration button and Back / Next.

Visual style: light gray working canvas with white cards. Primary blue `#1A6DBF`, dark landing navy `#0E3F6B`. Labels and drawing text use Barlow Semi Condensed; the interface uses Inter. Drawing sheets use classic double-line borders.

## What the prototype does not do yet (needed for production)

- Station editing: station data is hard-coded to the 7332 example, so fields, Add Station and remove do not save changes.
- Saved configurations: Reload Past Configuration and the config number do not save or load anything.
- Generated text: operation order, sequence of operation, utilities summary and description are fixed text. They should be built from the station data.
- Station placement: the layout uses five fixed positions. It needs automatic or drag-based placement for any number of stations.
- Title block fields: date, drawing number and version are fixed. They should pull from BC numbering (BC-Q-YYNNN).
- Missing pieces from the Web Builder plan: a standard-or-custom option menu for each item; customer contact capture; a new inquiry log entry when a document is generated; the pricing tie-in (free preview, $50 full quote, $3,200 custom request).
- Look and branding: currently a light theme. The planned website is dark-themed with a new typeface, so the tool's container and landing screen need restyling. The "Made with Claude Design" badge must be removed.

# Process Document Builder Spec (Web Builder)

Spec for the Process Document Builder, the "Web Builder" in `reference/business/Block_Concepts_Consulting_Business_Plan.docx`. It is a Hybrid tool (see `system-architecture.md`): a public Website side in the Fix this column, and a Concepts Vault side in Log List, Registry and Customers. The working prototype is described in `reference/builder/process-document-builder-prototype.md`. Edit directly and re-upload to refine.

> **Status: draft.** Written from the prototype description. Items marked **Open** need Grant's decision before they are built.

---

# Build this (Process Document Builder)

### Main Prompt

A customer-facing tool, publicly named **Build this** (working name; **Open**: confirm the name). A visitor lays out a production line one machine at a time and the tool produces a process document on standard engineering drawing sheets, ready to print or save as PDF. It is a sibling button in the Fix this column, next to Grab this, Give this and Develop this.

#### Additional Prompt: Website Side, Flow

Three screens:

- **Welcome.** Full-screen landing with a faint blueprint grid, a "Block Concepts LLC" pill, a "Welcome" heading, one line of explanation and a Start Building button.
- **Step 1, Stations.** Two columns.
  - Left: station cards added in product-flow order. Each card has a numbered badge, an editable station name, a flow tag and a remove button. Fields: Station Type, Speed, Parts/Cycle, Length, Width, Air, Electrical, Flow Direction (Left → Right, Right → Left, Vertical). A dashed Add Station button sits at the bottom.
  - Right (sticky): a live 11×8.5 gridded overhead layout that redraws as fields change, and a "Proposed Operation Order" card (for example 3 → 2 → 1 → 4) with a short note.
- **Step 2, Process Document.** Two print-ready sheets and a Print / Save as PDF button.
  - Sheet 1 (landscape, ANSI A), "Overhead View, Process Layout": control cabinet (marked tentative), station boxes labeled with name, type, L×W and speed, numbered tags and flow arrows.
  - Sheet 2 (portrait), "Process Description": summary paragraph, Station Schedule table, numbered Sequence of Operation and Utilities Summary (main power, control voltage, air pressure and use, washdown spec).
  - Title block on both sheets: proprietary notice, tolerance notes, company name with email and phone, title, date, size, version, scale, drawing number and "Sheet X of N".

Persistent controls: a step rail along the top (active and done states) and a config bar with a Config Number field, Reload Past Configuration, and Back / Next.

#### Additional Prompt: Station Data Model

One record per station, shared by the Website preview, the generated document and the Vault.

- **Fields:** position (order in flow), name, station type, speed, parts per cycle, length, width, air, electrical, flow direction, option (**Standard** from the catalog, or **Custom** with a free-text detail field).
- **Station type catalog:** **Open**. The business plan lists "define the standard-option catalog" as unresolved. The Vault owns this list (Settings) so it can change without a code change.
- **Placement:** automatic for any number of stations, following flow direction, with optional drag adjustment. The prototype's five fixed positions go away.

#### Additional Prompt: Generated Text

The operation order, description, sequence of operation and utilities summary are built from the station data, not typed:

- **Operation order:** derived from position and flow direction.
- **Sequence of operation and description:** assembled from per-station-type text templates held in the Vault (Settings), filled with the station's own values.
- **Utilities summary:** totals and maxima computed from the stations' air and electrical fields.
- Generated wording must not state firm prices, lead times or commitments. The document is a proposal basis, not a quote.

#### Additional Prompt: Saved Configurations

- Every generated document saves its inputs under a **configuration number**. Reload Past Configuration loads a saved configuration by that number.
- A visitor can reload only configurations they hold the number for. Numbers must not be guessable in sequence. **Open**: whether to add an email check before reload.
- Saved configurations live in the Vault's data (Log List row plus the station data), not only in the visitor's browser.

#### Additional Prompt: Tiers and Pricing

From the business plan; each tier has a different output and a different Vault outcome:

| Tier | Price | What the visitor gets | What lands in the Vault |
|---|---|---|---|
| Preview | Free | Layout preview and process document, no pricing or BOM | Log List row, Status New |
| Full Quote | $50 | Itemized priced quote from the standard catalog, remote | Log List row, then a quote serial |
| Custom Request | $3,200 | On-site meeting and environment identification, feeds consulting Stages 1 and 2 | Log List row, Customer record, Build State Quoting |

- **Open:** how payment is taken (a payment provider is a new integration and a new decision) and whether the $50 credits toward a purchase or a Custom Request (also open in the business plan).
- **Open:** whether the first release ships Preview only. Recommended: yes. Paid tiers follow once the payment provider is chosen.

#### Additional Prompt: Customer Contact Capture

- Before a document is generated, the visitor gives Name, Company, Email and Phone. Only Email is validated, as in Give this.
- The same Customer matching rule as Give this applies (match by email or company, otherwise create).

#### Additional Prompt: Outputs

Generating a document produces **both** formats from the same station data:

- **PDF drawing sheets:** Sheet 1 (overhead layout, landscape ANSI A) and Sheet 2 (process description, portrait), as described under Flow. Printed on the `light` theme in Overpass.
- **Word process document:** a `.docx` built to `design/system/word-documents.md` (US Letter, Aptos, cover page with mark and wordmark, page art, Block Concepts tables). It carries the same layout figure, station schedule, sequence of operation and utilities summary, plus the document number next to the logo.
- Both carry the same drawing/document number (`BC-W-YYNNN`) and version.
- The visitor can print or save the PDF, and download the Word file. Both are stored with the Log List row.
- **Open:** whether the Word document is offered on the free Preview tier or only on paid tiers.

#### Additional Prompt: Branding and Look

- The tool uses the Block Concepts design system in `design/system/` like every other tool. The prototype's palette (`#1A6DBF`, `#0E3F6B`), light theme, Barlow and Inter fonts are discarded, not ported.
- The screens (welcome, step rail, station cards, config bar, buttons) use the `dark` theme, Overpass, and the design system's components and tokens. Missing components (step rail, station card, sticky preview, form controls) are added to the design system first (`design/DESIGN-SYSTEM.md`, gaps 1, 5, 7).
- The welcome screen is a Block Concepts landing in the system's style (near-black surface, Steel Blue accents, the corner line pattern from `design/system/assets/Patterns/`); it replaces the prototype's full Steel Blue landing.
- **Drawing sheets** (the PDF) use the `light` theme, Overpass, and the design system's drawing roles (gap 9): line, label, double-line border and title block. They print on white regardless of the site theme. The drawing number sits at the top left next to the logo, as on the system's Word documents. The Word document follows `word-documents.md` and uses Aptos.
- Public wording follows the system's copy rules (no emoji, no superlatives, no named customers, suppliers or locations).
- The "Made with Claude Design" badge is removed.

---

### Additional Prompt: Concepts Vault Side

- **Log List row:** one row per generated document. Columns: Name, Company, Email, Phone, configuration number, tier, station count, submission timestamp, Status (New / Contacted / Quoted / Closed), Build State, Registry serial, and the process document PDF in the embedded file column.
- **Update List:** follow-up notes reference the row by its reference number, as for Give this.
- **Customers:** the visitor matches or creates a Customer record; the record links to its configurations.
- **Registry:** type code `W`. `BC-W-YYNNN` is the configuration and drawing number, issued when a document is generated. A Full Quote then gets a normal `BC-Q-YYNNN`, so free previews do not use up quote numbers. (The prototype's idea of drawing numbers from `BC-Q` would have burned a quote number on every free preview.) Per the design system, `BC` registry numbers are internal; the customer-facing document shows the `BC-Q-YYNNN` document number only on a quote or proposal, and the drawing number on the sheets. **Open:** confirm that showing `BC-W` on the sheets is acceptable.
- **Settings:** station type catalog, per-type text templates, and tier prices live here, so they change through Apply instead of a code change.
- **Change Management:** a revised catalog or template set is logged like any other revision.
- **Inquiry hand-off:** a Custom Request row is the intake for consulting Stages 1 and 2 (see the business plan). There is no monday.com integration, per the Hub spec.

### Additional Prompt: Not Handled Here

- Final engineering design, the Design Specification, the priced proposal and manufacturing. Those are later consulting stages.
- Quote document generation. It stays in the existing Python flow, outside the app.

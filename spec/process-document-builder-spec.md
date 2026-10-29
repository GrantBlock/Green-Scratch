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

#### Additional Prompt: Branding and Look

- The tool inherits the shared Design Tokens in `system-architecture.md`. The prototype's own palette (`#1A6DBF`, `#0E3F6B`) and light theme are replaced by those tokens.
- **Open, affects the whole site:** the prototype notes that the planned website is dark-themed with a new typeface, but `system-architecture.md` says black text on white with Steel Blue. One must change. Until decided, build to the spec's tokens.
- The drawing sheets keep their own print styling (double-line borders, Barlow Semi Condensed labels), because they are engineering documents, not site chrome.
- The "Made with Claude Design" badge is removed.

---

### Additional Prompt: Concepts Vault Side

- **Log List row:** one row per generated document. Columns: Name, Company, Email, Phone, configuration number, tier, station count, submission timestamp, Status (New / Contacted / Quoted / Closed), Build State, Registry serial, and the process document PDF in the embedded file column.
- **Update List:** follow-up notes reference the row by its reference number, as for Give this.
- **Customers:** the visitor matches or creates a Customer record; the record links to its configurations.
- **Registry:** a new type code for configurations. **Proposed:** `BC-W-YYNNN` for the configuration and drawing number, issued when a document is generated. A Full Quote then gets a normal `BC-Q-YYNNN`, so free previews do not use up quote numbers. **Open:** confirm. The prototype said the drawing number should come from `BC-Q-YYNNN`; that would burn a quote number on every free preview.
- **Settings:** station type catalog, per-type text templates, and tier prices live here, so they change through Apply instead of a code change.
- **Change Management:** a revised catalog or template set is logged like any other revision.
- **Inquiry hand-off:** a Custom Request row is the intake for consulting Stages 1 and 2 (see the business plan). There is no monday.com integration, per the Hub spec.

### Additional Prompt: Not Handled Here

- Final engineering design, the Design Specification, the priced proposal and manufacturing. Those are later consulting stages.
- Quote document generation. It stays in the existing Python flow, outside the app.

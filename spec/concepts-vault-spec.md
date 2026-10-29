# Concepts Vault — Shared System Spec

> **Being rewritten.** The platform direction (`docs/PLATFORM-CONCEPT.md`, `spec/data-model.md`) changes the Vault's tabs, storage and records. Where this file disagrees with `data-model.md`, the data model wins. See `PLAN.md`, Phase 1.

Spec for the Concepts Vault half of Concepts Hub (see `system-architecture.md`) — the single admin system shared across every tool in this website section (not just Grab this). Grab this and Give this specs live in `concepts-hub-spec.md`, which reference this file for how entries get authored and logged. Registry and Customers are included here as admin tabs. Edit directly and re-upload to refine.

---

## Access

### Main Prompt

- Password-protected Concepts Vault, single user (Grant only). No multi-user login needed.
- **Storage/backend:** Concepts Vault's data (entry metadata, log rows, registry counter, settings) lives as files in a OneDrive-synced folder, not a hosted database. Power Automate is the backend logic layer — reading/writing the Vault's data files via its native OneDrive connectors — rather than a custom-built server. This keeps everything in the OneDrive-centric workflow Grant already uses.

---

## Admin Tabs

### Main Prompt

The Concepts Vault mirrors the public portal's tab pattern: a horizontal tab bar at the top switches between admin tools. Six tabs:

- **Log List:** The unified cross-tool activity log (entries added/edited, form submissions, etc.), each row with an embedded file column. See "Unified Admin Log" below.
- **Releases:** Contains Change Management and Release Management content together — see below.
- **Directory:** A master list of every page on the website (a site map), not an entry-authoring tool — see below.
- **Customers:** A CRM-style structured record of customers — see below.
- **Settings:** A list of settings that modify the website's pages. See "Settings" below.
- **Registry:** The company-wide stock code registry, extended to cover documents. See "Registry" below.

#### Additional Prompt — Releases

This tab, named **Releases**, holds two things, split by publish state:

- **Release Management:** Where new entries are published for the first time. Covers taking a newly authored entry live via the Apply/publish step. Both authoring (picking the file, filling in metadata) and the "go live" step happen here.
- **Change Management:** Where already-published entries get revised. Flexible and applies to all documents (not scoped to just one tool's entries). Entries here are manual — Grant adds them himself as needed, rather than the system auto-generating a fixed revision-history record. Functions as a running, Grant-maintained changelog rather than a rigid staged-review workflow.

The split is publish-state-based: Release Management is the first-publish step; Change Management is every revision after that.

#### Additional Prompt — Directory

- The Directory is a website directory only — a master list of all pages on the site (a site map), not a list of document entries and not the entry-authoring home. Entry authoring lives in Release Management (see above) instead.

#### Additional Prompt — Customers

A CRM-type structured internal tool, Vault-only (no public Website-side page — per the "Vault-only tool" shape in `system-architecture.md`).

- **Purpose:** A structured record of Block Concepts' customers, distinct from the raw activity in Log List — Log List shows individual submissions/entries as they happen, Customers is the standing record of who each customer is over time.
- **Customer record fields:** Name, Company, a three-letter Client Code (assigned before the first quote; `GEN` for prospects), Email, Phone, and a running list of everything tied to that customer — linked Log List rows (Give this submissions, any entries relevant to them), linked Registry serials, and Update List notes.
- **Relationship to Give this, Build this and Ask this:** When a Give this, Build this or Ask this submission comes in, it either matches an existing Customer record (by email/company) or creates a new one — keeping the CRM populated without separate manual data entry.
- **Relationship to Registry:** Since Registry is the company-wide part-number source of truth, a Customer record can show which stock codes/quotes/jobs are tied to them, pulling from Registry rather than duplicating that data.
- **Not a replacement for:** monday.com or a dedicated CRM platform for pipeline/sales-stage management — this is a lighter, structured contact record living alongside the rest of the Vault's self-contained data, consistent with the earlier decision to skip external CRM integration.

#### Additional Prompt — Content Authoring (Hybrid CMS)

Define the entry-creation experience shared by every tool, hosted inside Release Management:

- An admin form is used to create/edit entries: pick file(s) from OneDrive via a file picker (rather than re-uploading from scratch), then fill in whatever metadata fields that tool's entries require (e.g., for Grab this: Title, Description, "When to use," Tab/Item placement).
- Uploading a new file against an existing entry creates a new revision, where the tool supports revisions (Grab this: up to 3).
- This avoids pure auto-import from OneDrive (which can't produce judgment-based fields like "when to use" or category placement) while still working out of the OneDrive files Grant already maintains day to day.
- Each tool defines its own entry fields/data model in its own spec — this system just provides the shared authoring mechanism (OneDrive picker + form + revisioning), not a fixed field set.
- Every new entry created here is issued a serial number by the **Registry** tab at creation time (see below).

#### Additional Prompt — Unified Admin Log

Define the cross-tool activity log, shown in the **Log List** tab:

- A single, simple list (not a card grid or kanban — a straightforward row-per-item list) aggregates activity from every tool in the section — not just Grab this. This includes entries added/edited and any form submissions from any tool.
- Each row includes an embedded file column: the associated PDF (or its first-page preview) is viewable directly inline in that row, without leaving the log or opening the public-facing entry.
- **Filtering:** The list is filterable by its first two columns — **Status** and **Build State**.
  - *Status* — per-row workflow state: New / Contacted / Quoted / Closed (for Give this submissions, per `concepts-hub-spec.md`).
  - *Build State* — a status field controlled by a dropdown list, values: Quoting, Designing, Purchasing, Manufacturing, Assembling, Completed.
- **Registry serial column:** Each row also shows its Registry-issued serial number (see "Registry" below), so any row is traceable to its `BC-D-YYNNN`-style identifier.
- **Reference to Update List:** Each row references an entry in the separate Update List (see below) via a reference number, rather than embedding update notes directly in the row.
- This log is the single dashboard Grant checks for activity across all tools — no monday.com or external CRM integration; everything stays self-contained here.

#### Additional Prompt — Update List

- The running notes/messages tied to Log List rows (e.g., quote-request follow-up notes) are not embedded inline in the Log List row. Instead they live in their own separate list — a dedicated Update List.
- Each note in the Update List carries a reference number tying it back to the Log List row it concerns (and, since Registry now covers all Block Concepts stock codes, this reference number can align with that same numbering system).
- Grant posts manual, timestamped notes here as he works a lead or tracks a change — a lightweight activity feed, implemented as its own list/tab-adjacent view rather than an inline expandable panel.
- Since Grant posting notes is inherently tracked (single admin user), "who posted" is implicitly always Grant — the Update List itself functions as the log of that activity.

#### Additional Prompt — Archive

- The Archive is a shown list of everything that is hidden from other lists (Log List, Update List, etc.) — i.e., a visible index of archived/hidden items, not a black hole.
- Rows move to the Archive only via manual action (Grant selects a row and archives it) — nothing archives itself based on age or status.
- Reversible: Grant can return any archived row back to its original shown/active list from the Archive view.
- Archived rows keep their full data — archiving just relocates/hides them from the active views, it doesn't delete or strip anything.

#### Additional Prompt — Settings

- A dedicated tab that is simply a list of settings that modify the website's pages and tools — a straightforward settings list, not a complex staged/preview system.
- Changes are staged, not live-applied instantly: an Apply button commits the changes. Until Apply is pressed, edits are just pending/previewed.
- **Publish mechanism:** Git-based publishing — Apply commits changes to a Git repo, which triggers a rebuild/deploy on the hosting platform. This pairs naturally with the Registry serialization system (below): each commit can be cross-referenced with the Registry serial(s) it touched, giving a full audit trail.
- **Relationship to OneDrive/Power Automate storage (see Access above):** These are two different jobs, not competing choices. OneDrive + Power Automate is where the Vault's data lives and gets worked day to day; Git-based Apply is the separate step that pushes a snapshot of that data live to the public website.

#### Additional Prompt — Registry

Registry is the company-wide stock code registry for Block Concepts — every stock code across the business, not just website document entries. Concepts Vault is the single source of truth for all Block Concepts part numbers going forward, functioning like a lightweight ERP for numbering. Website document entries are one category within this broader registry, extending the existing numbering convention (`BC-Q-YYNNN` for quotes, `BC-J-YYNNN` for jobs).

- **Format:** `BC-[TYPE]-YYNNN` — company prefix, a type code, two-digit year, sequential counter.
- **Type codes:**
  - `D`: general documents and forms that are not project-specific (Grab this entries, Give this and Ask this submissions). `BC-D-YYNNN`.
  - `W`: web-builder configurations (Build this), issued when a document is generated, so free previews never use quote numbers. `BC-W-YYNNN`.
  - `Q`: quotes. `BC-Q-YYNNN`.
  - `B`: builds. Created when a quote is awarded; carries the quote's `YYNNN` digits unchanged (`BC-Q-26042` awarded becomes `BC-B-26042`), so it has no counter of its own.
  - `J`: jobs. `BC-J-YYNNN`. A job record has a **Build** field and a **Category** field (03 Electrical, 06 Mechanical, 09 Hardware, 12 Supplies, 15 Made-in, 18 Assembly, 21 Item, 24 Engineering, 27 DevOps). The category is a field, not part of the serial.
  - `L`: library work orders, reusable and not tied to a build. `BC-L-YYNNN`, with the same Category field.
  - Project-specific documents keep the code of the project record they belong to.
- **Counter behavior:** Sequential, resets to 001 at the start of each calendar year, per type code — matching the existing BC-Q/BC-J pattern.
- **Assignment point:** The serial is issued once, when a document entry is first created through the authoring form in Release Management. Not re-issued on every revision — the serial identifies the entry, not the specific file version.
- **Registry tab contents:** Shows the current counter state per type code (e.g., next `BC-D-YYNNN` to be issued) and a browsable list of every serial issued so far — spanning all Block Concepts stock codes, not just documents — with a link back to the entry/item it belongs to.
- **Voiding:** a number is never reused or deleted. A mistaken or abandoned serial is set to **VOID** and stays in the list. Quotes that do not convert keep their number.
- **Manual override:** Grant can view/re-issue or correct a serial if something goes wrong (e.g., a duplicate, a typo), rather than the counter being fully black-box.
- **Git tie-in:** Since publishing is Git-based (see Settings above), each document entry's serial can be cross-referenced with the commit(s) that created/revised it, giving a full audit trail from serial number to file change.

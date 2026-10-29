# Concepts Hub Spec — Website

Spec for the Website half of Concepts Hub (see `system-architecture.md`) — the site shell/navigation/hosting, plus the two public tools: **Grab this** (Document Portal) and **Give this** (Form Submission), plus **Develop this** (Process section). Concepts Vault (the shared admin system) lives in its own `concepts-vault-spec.md`. Edit directly and re-upload to refine.

---

## Site Shell

### Main Prompt

Design tokens for the site (color, type, visual feel) are defined once in `system-architecture.md`'s "Design Tokens" section, since both the Website and Concepts Vault share them — see that file rather than this one for the actual values.

#### Additional Prompt — Navigation & Naming

- **Single domain.** All tools are sub-pages under a `/tools` path — not a subdomain, not standalone sites.
- **Main nav:** **Concepts Hub** (Home), **Who this** (About), **Fix this** (Tools landing page).
- **Concepts Hub (Home) and Who this (About) are static pages** — no Concepts Vault presence needed. Content there doesn't go through the entry-authoring/log system described in `concepts-vault-spec.md`; per `system-architecture.md`, not every page requires an admin-side counterpart.
- **Fix this** (Tools landing page): Functions as the "About Web Tools" page — explains how to use the tools in this section (usage instructions for a visitor). Layout: a 1/5-width column of buttons on the left, one per named tool/section, with the remaining 4/5 as the content area showing whichever is selected. This mirrors Grab this's own column-based drill-down pattern rather than a single scrolling page with jump links.
- **Named buttons in the Fix this column (all three are siblings — Give this is not nested inside Grab this):**
  - **Grab this** — Document Portal, spec below.
  - **Give this** — Form Submission / Contact Us, spec below.
  - **Develop this** — the Process section (Supplying, Guiding, Customizing), spec below.
- **Future tools/sections** added the same way, each getting its own "___ this"-style name and its own button in the Fix this column — though per `system-architecture.md`, a future addition could also be a static page with no admin presence, not necessarily a full tool.
- **Vault access:** The Fix this page includes a separate button (distinct from the tool buttons) that leads to the password-protected Concepts Vault login, per `concepts-vault-spec.md`. This button is visually distinct from the public tool entry points but lives on the same page.

#### Additional Prompt — Hosting & Stack

Not currently a priority — revisit once the rest of the spec set is settled.

---

# Grab this (Document Portal)

### Main Prompt

What is specific to the document-sharing portal tool itself, publicly named **Grab this**. Shared systems (Concepts Vault CMS, cross-tool log, OneDrive picker) live in `concepts-vault-spec.md`.

#### Additional Prompt — UI Design

Design a document-sharing portal with a four-zone drill-down layout:

- **Top bar — Tabs:** Horizontal row of top-level subject categories. One tab is active at a time; switching tabs resets the item/sub-item selection below it. The tab bar auto-scales to a fixed number of categories (no scrolling/wrapping needed).
- **Column 1 (1/5 width) — Item list:** Subcategories belonging to the active tab, shown as a vertical list on the left. Selecting an item populates Column 2.
- **Column 2 (1/5 width) — Sub-item list:** Individual entries belonging to the selected item, shown as a vertical list. Includes a search/filter box scoped to sub-items only. Selecting a sub-item populates Column 3.
- **Column 3 (3/5 width) — Entry detail pane:** Shows the selected sub-item's full record: file preview, title, description, "when to use" guidance, and a download link/button.

**Layout behavior:**
- Desktop: Columns 1–3 sit side by side below the tab bar, full viewport width, no page scroll on the nav columns (they scroll independently if a list overflows).
- Mobile: on tab selection, the item + sub-item columns display together as a full-width two-column menu. Selecting a sub-item switches to a full-width view of the entry detail pane.
- Empty states: Column 2 is empty/placeholder until an item is selected; Column 3 is empty/placeholder until a sub-item is selected.
- Selected state is visually distinct in Columns 1 and 2 (active row highlighted).

**Visual style:**
- All color, type and spacing come from the Block Concepts design system (see "Design Tokens" in `system-architecture.md`); this tool defines none of its own.
- The selected-row highlight uses the design system's accent token role.
- File preview: a static image of the file's first page (not an interactive/paginated viewer).

#### Additional Prompt — Contents of Entries

Define the data model for each entry. A "sub-item" and an "entry" are the same object — the sub-item list (Column 2) is the list of entries.

- **Core fields:** Title, Description, "When to use" guidance, File preview image (first page of the primary file), Downloadable file(s).
- **File types:** PDF only.
- **Files per entry:** Up to 5 PDFs attached to a single entry, but only one file preview image shown (preview reflects the primary/latest file).
- **Versioning:** Each entry supports up to 3 revisions. The latest revision is shown by default; older revisions are accessible via a revision selector in the top-right corner of the detail pane (Column 3).
- **Category hierarchy:** Tab (subject) → Item (subcategory) → Sub-item/Entry (the document record itself).

#### Additional Prompt — Accessibility

Define accessibility requirements for the drill-down portal:

- **Keyboard navigation:** Tabs, item list, sub-item list, and the detail pane's revision selector/download button must all be reachable and operable via keyboard alone (Tab/Shift+Tab to move focus, Enter/Space to select).
- **Focus behavior:** Selecting an item/sub-item populates the next column only — focus does NOT auto-jump into that column. Column 3 (entry detail pane) has an expand button in its top-left corner that the user can activate to make it full-width; this is the mechanism for giving the detail pane full focus/attention, not automatic focus-stealing.
- **Screen reader behavior:** Tabs, item list, and sub-item list should use appropriate ARIA roles (e.g., `tablist`/`tab`, `listbox`/`option`) so assistive tech announces selection state and list position. The detail pane should announce when its content changes.
- **Contrast:** Body text, the accent highlight and focus indicators, in every theme the design system defines, must meet WCAG 2.1 AA contrast minimums (4.5:1 for text, 3:1 for UI components/focus indicators).
- **File preview:** The first-page preview image needs descriptive alt text (e.g., derived from the entry title) since it's a static image, not readable text.
- **Search box (Column 2):** Needs a visible or programmatically associated label, not placeholder-only text.
- **Compliance target:** WCAG 2.1 AA, best-effort (not a formal legal/contractual audit requirement) — appropriate given this is a public-facing sales/lead-gen tool, not a government or contract-mandated deliverable.

#### Additional Prompt — Tool-Specific Integration

Define what this tool specifically feeds into the shared systems (full mechanics live in `concepts-vault-spec.md`):

- **Purpose:** Sales lead generation — public browses application/requirement documents.
- **Entry authoring:** Entries in this tool (Title, Description, "When to use," PDF files, revisions) are created/edited through the shared Concepts Vault's entry form, using the shared OneDrive file picker.
- **Relationship to Give this:** Give this is not reached from inside Grab this's UI (no button in Column 3). Both are sibling buttons in the Fix this page's navigation column. A visitor viewing an entry in Grab this who wants to inquire navigates back out to the Fix this column and selects Give this, which still auto-fills the entry/document context it was last showing.
- **Log contribution:** Every new/edited entry made through this tool appears as a row in the shared admin log (with embedded file column), per `concepts-vault-spec.md`.
- **Not handled here:** The contact/quote request form itself (below, Give this), quote generation, and formal proposal/documentation management — those happen elsewhere, outside this portal.

---

# Give this (Form Submission)

### Main Prompt

The form submission tool, publicly named **Give this**. Standalone tool/page, not embedded inside Grab this. Shared systems (Concepts Vault CMS, cross-tool log, OneDrive picker) live in `concepts-vault-spec.md`.

#### Additional Prompt — Purpose & Trigger

- Functions as the site's general **Contact Us** — reachable directly from the Fix this page like any other tool, for any visitor regardless of how they arrived.
- **Auto-detection:** if a visitor arrives here from Grab this (or a future tool) via a link, the form still auto-fills which entry/document/tool they were viewing, so the context isn't lost just because this is a separate page.
- If a visitor arrives directly (not from another tool), the context fields are simply left blank/general.

#### Additional Prompt — Form Fields

- **Contact info:** Name, Company, Email, Phone.
- **Context (auto-filled when arriving from another tool, blank otherwise):** The entry/document title and Tab/Item category the request originated from, if any.
- **Project details:** Free-text field for the visitor to describe their application/requirement.
- **File attachment (optional):** Ability for the visitor to attach a file of their own (e.g., a drawing or spec sheet), separate from the portal's own document entries.
- **Validation:** Only Email is validated (proper email format required). No validation on the other fields.

#### Additional Prompt — Submission & Handling

- On submit, the submission becomes a new row in the shared admin log (per `concepts-vault-spec.md`), with the visitor's attached file (if any) or the referenced entry's file viewable inline via the log's embedded file column.
- No monday.com or external CRM integration — the admin log is the sole destination for this data.
- **Automatic confirmation:** The visitor receives an automatic confirmation after submitting (exact delivery method — email vs. on-screen message, or both — still to be decided at build time).
- **Not handled here:** Actually producing a quote or proposal — that happens in a separate tool entirely, outside this system. This form only captures and logs the submission.

#### Additional Prompt — Log Row Structure

Define the columns shown for a submission row in the admin log:

- **Contact/context columns:** Name, Company, Email, Phone, referenced entry/tool (if auto-detected), submission timestamp — one column each (pulled from the form fields above).
- **File column:** Embedded/inline preview of the visitor's attached file or the referenced entry's file, per the shared log pattern in `concepts-vault-spec.md`.
- **Status column:** New / Contacted / Quoted / Closed.
- **Update notes:** Not an inline column/panel on this row. Follow-up notes for a submission live in the separate **Update List** (see `concepts-vault-spec.md`), referenced back to this row by a reference number.

---

# Develop this (Process Section)

### Main Prompt

A website section describing Grant's process, publicly named **Develop this**, one of the three buttons on the Fix this page. Three subsections:

- **Supplying:** Covers distribution and sales representation of completed equipment.
- **Guiding:** Describes a project-type rating system, presented in this fixed order, representing increasing complexity relative to lead time:
  1. Automation Distribution
  2. Customized Equipment
  3. Production Line
  4. Functional Prototype
  - The rating measures **complexity compared to lead time** — the order is a progression, from Automation Distribution (lowest complexity relative to lead time) through Functional Prototype (highest).
- **Customizing:** Covers full design/build.

# System Architecture

> **Being rewritten.** The platform direction (`docs/PLATFORM-CONCEPT.md`, `spec/data-model.md`) adds Opportunities, Projects, Documents, Knowledge and a Vault assistant. Where this file disagrees with `data-model.md`, the data model wins. See `PLAN.md`, Phase 1.

The top-level architecture doc for the whole system. Describes how the pieces fit together; individual specs still own their own detail. Edit directly and re-upload to refine.

---

## The Two Pieces

### Main Prompt

The system is built from exactly two top-level pieces, not one monolithic app:

* **Concepts Hub** — the public-facing piece. Single domain, tools live as sub-pages under `/tools`. Main nav: Concepts Hub (Home), Who this (About), Fix this (Tools). Visitors browse documents, use tools, and submit forms here. Fully defined in `concepts-hub-spec.md`.
* **Concepts Vault** — the private, single-user piece. Password-protected, separate from public navigation. Where Grant authors content, manages the activity log, adjusts settings, and issues part/document serials. Fully defined in `concepts-vault-spec.md`.

The Concepts Hub is joined to the Concepts Vault by the Apply/publish step (Git-based, per `concepts-vault-spec.md`'s Settings section) — Concepts Vault is where changes are made, Apply is the bridge, Website is where they become visible. Concepts Vault is a standalone program for clerical engineering work while on the go.

---

## Web Tools — Designed for Both Sides

### Main Prompt

A "Hybrid tool" (Grab this, Give this, and future hybrid tools) is not exclusive to either piece — each one has a presence in both, and the two halves work together as a system.

#### Additional Prompt — Grab this

* *Website side:* The public four-zone drill-down browsing experience, in `concepts-hub-spec.md`.
* *Concepts Vault side:* Entries are authored through Release Management, tracked in the Log List, revisioned through Change Management, and serialized through Registry (`concepts-vault-spec.md`).

#### Additional Prompt — Give this

* *Website side:* The public Contact Us form, with auto-detection of referring tool/entry, in `concepts-hub-spec.md`.
* *Concepts Vault side:* Every submission lands as a row in the Log List, with its own Status and reference into the Update List, viewable and archivable like any other row (`concepts-vault-spec.md`).

#### Additional Prompt — Build this

* *Website side:* The public Process Document Builder (stations in, PDF drawing sheets and a Word process document out), in `process-document-builder-spec.md`.
* *Concepts Vault side:* Every generated document lands as a Log List row with its configuration number, is serialized through Registry, and links to a Customer record (`process-document-builder-spec.md`).

#### Additional Prompt — Ask this

* *Website side:* The public agent chat window (Pato, quoting), in `concepts-hub-spec.md`.
* *Concepts Vault side:* Each chat that reaches the lead stage lands as a Log List row with the visitor's contact details and a transcript, with a Registry serial (`concepts-hub-spec.md`).

#### Additional Prompt — Future Tools

Any new tool added to the system follows one of three shapes:

* **Hybrid tool** — both a public Website-side page and a Concepts Vault-side authoring/tracking presence (Grab this, Give this).
* **Vault-only tool** — exists only inside the Concepts Vault, with no public-facing page (e.g., Customers, a CRM-style structured record of customers, per `concepts-vault-spec.md`).
* **Static Website page** — exists only on the Website side, with no Concepts Vault presence at all (e.g., a plain informational page like Who this that never needs authoring/tracking through the admin system).

---

## Shared Foundation Across Both Pieces

### Main Prompt

* **Design tokens:** Both Website and Concepts Vault draw from the same visual system, so the admin experience doesn't look like a bolted-on separate product. See "Design Tokens" below for the actual values.
* **Data model:** Entry structure (title, description, files, revisions) is defined once per tool in that tool's own spec, and both sides read/write against the same model — the Concepts Vault doesn't maintain a separate shadow copy of what the Website displays.
* **Registry:** Serial numbers issued in the Concepts Vault are the same identifiers that surface anywhere entries or part numbers need to be referenced, keeping one numbering scheme across the whole system rather than one per tool.

#### Additional Prompt — Design Tokens

Branding has exactly one source: the **Block Concepts design system**, authored in Claude Design and exported into `design/system/` (entry points: `design/system/README.md`, `website.md`, `word-documents.md`, `tokens.css`, `tokens.json`). No other spec, prototype or piece of code defines colors, typefaces, spacing or theme.

* **Source of truth:** `design/system/`. Both the Concepts Hub and the Concepts Vault import its `tokens.css` and `components/bundle.css`; nothing else defines color, type, spacing or radius.
* **The public website is the single source of truth** for positioning, pillar names (Engineering, Sourcing, Services), tone and company facts. The Hub and Vault never restate or contradict them; where they need that content they link to the website.
* **Uniform scope:** the public Hub, the Vault, every tool (Grab this, Give this, Develop this, Build this, Ask this), generated documents and any email or PDF output.
* **Themes (as defined by the design system):** `dark` is the website theme, set with `data-theme="dark"` on `<html>`. `light` is for documents and proposals. The Hub uses `dark`. Generated documents and drawing sheets use `light`. The Vault also uses `dark`, so the whole app looks like one product.
* **Brand rules that bind every tool:** Steel Blue is the only brand blue; blue text under 24px uses the `bc-steel-blue-text` token; square flat shapes (radius at most 4px), no shadows, no gradients, no decorative red or green; Overpass and Overpass Mono on screen; focus is a 2px `bc-steel-blue-text` outline; interactive targets at least 44px.
* **Copy rules that bind every tool:** speak as "we" or Block Concepts, never first-person singular; address the reader as "you"; no emoji, no exclamation marks, no superlatives; never name suppliers, brands, customers or locations; do not show Registry (BC) serial numbers publicly except the document number `BC-Q-YYNNN` on a customer's own proposal or quote.
* **Roles, not values:** specs refer to token names (`bc-ink`, `bc-surface`, `bc-steel-blue`...) or to roles, never to hex values or font names.
* Any new tool or Vault tab inherits the design system rather than defining its own. If something is missing, add it to the design system first (gaps are listed in `design/DESIGN-SYSTEM.md`).

#### Additional Prompt — Prompting for Both Sides

The pattern every hybrid tool spec should follow, so future tools are specified consistently instead of inventing a new shape each time:

* Define a **Website side**: what the public sees and interacts with — page/UI layout, fields a visitor fills in or content they browse, and how it's reached from the Fix this navigation column.
* Define a **Concepts Vault side**: how the tool's data gets authored/edited (Release Management), how it's tracked (Log List row shape, Status/Build State), how it's revised after going live (Change Management), and how it's serialized (Registry type code).
* Cross-reference between the two sides explicitly — e.g., Grab this's Website side notes it links out to Give this rather than embedding it, and Give this's Vault side notes exactly which columns appear in the Log List.
* A tool doesn't need both sides (see Future Tools shapes above — Vault-only and Static Website page are valid), but if it has both, each side gets its own Additional Prompt in that tool's spec, following this same Website-side / Concepts Vault-side split.

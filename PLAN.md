# Plan: Concepts Vault and Concepts Hub

Built workflow-first from `docs/WORKFLOW.md`, outward from the live website (`docs/RESET.md`). Records: `spec/data-model.md`. Concept and reasons: `docs/PLATFORM-CONCEPT.md`. Branding: `design/system/`.

**Legend:** 🧑 Grant · 🎨 Claude Design · 💻 Claude Code

---

## Phase 0. Decided

- [x] Direction: one platform. Public website (live), Concepts Hub (public tools and documents), customer project pages, Concepts Vault (private).
- [x] Names: Concepts Vault (private) and Concepts Hub (public). Tools inside use plain names (see `docs/WORKFLOW.md` section 4). All "___ this" names are dropped.
- [x] Stack: Cloudflare D1 + R2 + Vectorize; OneDrive for working Word and Excel files; Onshape for design.
- [x] Numbering: `BC-[TYPE]-YYNNN` with VOID.
- [x] States: Opportunity Open / Won / Lost; Project Design / Build / Install / Closed.
- [x] Phone and iPad first. Gantt with baselines. Category dropdowns, not groups. Invoices reviewed, not auto-sent.
- [x] cGMP: optional documentation package, no in-app signatures.
- [x] Assistant cap: $20 per month, up to $60 once it replaces the apps.
- [x] Pilot: enter about 30 opportunities and 6 projects by hand.
- [x] All public tools are in scope, internal use first.
- [x] Customers get files through expiring links, no accounts.
- [x] Addresses: `vault.blockconceptsllc.com` (private) and `hub.blockconceptsllc.com` (customer-accessible).

Still open:

- [x] Folder structure supplied (`docs/FOLDER-STRUCTURE.md`), with a Claude section for configurations, glossaries and standard works.
- [ ] 🧑 Required documents per folder; confirm the folder assumptions in `docs/FOLDER-STRUCTURE.md` (project subfolders repeat per project, cGMP Package location, `Claude - Company`).
- [ ] 🧑 Agent email address and mailbox type.
- [ ] 🧑 Money scope (recommended: track project financials; QuickBooks stays the books).
- [ ] 🧑 Apps 7 and 8 (you listed six).
- [ ] 🧑 Process page content (formerly Develop this).

## Phase 1. Design (🎨 + 🧑), can run alongside Phase 2

- [ ] 🧑 Add missing components with `design/GAPS-PROMPT.md`; re-export to `design/system/`.
- [ ] 💻 Update `design/BRIEF.md` with the Vault screens: Today, Calendar, Pipeline, Project (checklist, Gantt with baselines, Sourcing), Money (Receivables, Expenses), Accounts, Knowledge, Assistant panel, customer project page. All designed for phone and iPad.
- [ ] 🧑 Review mockups; export into `design/`.

## Phase 2. Build the Vault (💻), one slice per session

Each slice ends with Grant using it on real data. monday.com stays until slice 7.

| Slice | Delivers | Done when |
|---|---|---|
| 1 | Login, responsive shell (phone, iPad), D1, Registry, audit log, design system | You can sign in on an iPad; serials issue and never repeat |
| 2 | Accounts (customer, supplier, prospect) and Pipeline (Leads, Opportunities) | Your 30 opportunities are entered and filterable |
| 3 | Calendar and Today: visits, site visits, events, trips | You can plan next week's visits on your phone |
| 4 | Projects: customer and project folders created from the structure, activation from a template, checklist per folder, Documents (R2), Onshape and OneDrive links | Your 6 projects are entered with their documents |
| 5 | Schedule: Gantt with categories, dependencies, baselines, reasons for date changes, item updates | A project's schedule replaces its monday.com board |
| 6 | Money: milestones, invoices, receivables, overdue alerts, expenses, monthly export | You can see who hasn't paid and what a project cost |
| 7 | Cutover from monday.com | You stop using monday.com |

## Phase 3. Connect (💻)

| Slice | Delivers |
|---|---|
| 8 | Customer project pages on the Hub: expiring links, PDF downloads, upload requests. Vault publishes to a separate Hub bucket |
| 9 | Agent email: inbound routing, classification, filing proposals; reminders and drafts |
| 10 | Sourcing list per project and supplier quote tracking |
| 11 | Knowledge: research, articles, trip notes, links to accounts and events |
| 12 | Vault Assistant: search with citations, drafts, confirm-to-write, spend meter; loads the Claude section (configurations, glossaries, standard works) at company, customer and project level |

## Phase 4. Concepts Hub: internal first, then public (💻)

| Slice | Delivers |
|---|---|
| 13 | Contact: the website form creates a Lead in Inbox (the one change to the live site) |
| 14 | Builder: stations to PDF sheets and a Word process document, used internally from an opportunity |
| 15 | Library: publish customer-ready PDFs, then the public view |
| 16 | Hub link in the website navigation, pointing to `hub.blockconceptsllc.com` |
| 17 | Public Assistant: published content only |
| 18 | cGMP documentation package template |

## Phase 5. Before relying on it

- [ ] 🧑 DNS: add `vault` and `hub` subdomains in Cloudflare; put Cloudflare Access (or equivalent) in front of the Vault.
- [ ] Security pass: login, uploads, share links, email ingestion, assistant (prompt injection from emails and documents).
- [ ] Backups and a full export of records and files.
- [ ] Test on iPad and iPhone for every slice.
- [ ] Public Assistant tested with adversarial prompts; no Vault data reachable.
- [ ] Hub cannot read the Vault database or private files (check the bindings, not just the code).

## How to run each session

1. Open this repo in Claude Code. `CLAUDE.md` loads automatically.
2. Say which slice to do.
3. Use the result on real data; write down what is missing; then tick the box.
4. Anything not in Phase 0 comes to you first.

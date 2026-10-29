# Platform concept: one place for the day-to-day

**Status: approved direction, with the changes in section 7.** `PLAN.md` is rewritten around it, and `spec/data-model.md` is the new source for records. The older `spec/concepts-vault-spec.md` and `spec/concepts-hub-spec.md` are being brought in line (see `PLAN.md`, Phase 1).

## 1. What this is

A single private Vault (Concepts Vault) for running Block Concepts, with a thin public side (Concepts Hub). It replaces a stack of separate subscriptions with one data model, one search, one assistant.

It serves three jobs:

1. **Organize Grant's work:** inquiries, opportunities, projects, accounts, knowledge, trips.
2. **Deliver clear PDFs to customers, stored per project.**
3. **Support cGMP customers** with controlled documents and a traceable record on machine designs.

## 2. The improvements that make it uniform

### 2.1 One object model

Everything in the system is one of eight kinds of record. Each has a Registry number, a status, tags, links to other records, an activity feed and attachments. No tool invents its own record type.

| Object | What it is | Number | Replaces |
|---|---|---|---|
| **Lead** | An inbound inquiry (Give this, Ask this, Build this, email, phone) | `BC-D` | Log List rows |
| **Account / Contact** | A customer organization and its people | Client Code | Customers tab |
| **Opportunity** | A qualified lead being quoted, from inquiry to won or lost | `BC-Q` | Quote tracking |
| **Project** | An opportunity that was won. Activated with a default structure | `BC-B` (same digits as its Q) | Build register |
| **Job** | A unit of work in a project, with a category | `BC-J` | Job registers |
| **Document** | A controlled file with revisions, status and checksum | `BC-D` | Releases, Grab this entries |
| **Knowledge item** | Application research, sales research, articles, trip plans, notes | `BC-K` (new) | Notes apps, bookmarks |
| **Template** | Reusable project structures, checklists, document templates, work orders | `BC-L` | Library |

`BC-W` stays for Build this configurations.

### 2.2 One lifecycle spine

```
Lead  →  Opportunity  →  Project  →  Handover  →  Archive
BC-D     BC-Q (kept       BC-B         docs
         even if lost)    (same digits)  complete
```

- A lead gets a Q number only when you qualify it, so spam and tire-kickers don't use up numbers.
- A lost opportunity keeps its Q number and stays searchable as sales history.
- Winning it **activates** the project: the Q becomes a B with the same digits, and a default structure is created (below).

### 2.3 Project activation and document collection

When an opportunity is marked **Won**, the system creates, from a Template:

- A **document checklist** by section, each item with status: Missing, Requested, Received, In review, Released.
- **Jobs and milestones** from the template (including the 60/30/10 billing milestones).
- A project folder in OneDrive with a matching structure.

Folders follow Grant's structure in `docs/FOLDER-STRUCTURE.md`: six folders per customer, six inside each project, and a new Claude section at company, customer and project level.

How documents get in: drag and drop, a picker from OneDrive, an email-in address per project, and an **upload request link** you send to a customer for a specific missing item. The project page shows a completeness bar so you can see what is still missing.

### 2.4 One knowledge base, linked to the work

Knowledge items live in the same system, not beside it. Each can link to accounts, opportunities, industries or projects, so "everything we know about this customer" is one view.

Kinds: application research, sales research, articles (saved with source and a summary), trip plans (itinerary plus the accounts visited), meeting notes, and how-to notes.

### 2.5 One assistant, in the Vault

Claude replaces the local Pato / Hukata / Kosala app as a single assistant that knows your records.

- **Search and answer across everything:** "What did we quote for conveyor work in the last two years?", "Which projects are missing a SAT protocol?", "Summarize everything on this account before my call." Answers cite the records they came from.
- **Roles follow the lifecycle:** Pato mode on opportunities (quoting), Hukata on projects (building), Kosala on handover and support. One assistant, three lenses.
- **How it works:** the app indexes records (full-text plus embeddings). Claude is called from the server with tools such as search, read record, list documents and draft. The model key stays on the server.
- **It proposes, you confirm.** It never sends email, changes status or deletes without an explicit confirmation, and every action it takes is written to the audit log.
- **Hard separation from the public agent:** the public Ask this agent sees only published content. It has no access to Vault data.
- **Prompt-injection care:** text from articles, emails and uploaded documents is treated as data, not instructions.

### 2.6 One document model

Customer PDFs, manuals, Grab this entries and Build this outputs are all Documents.

- Revision number, status (Draft, In review, Released, Superseded), checksum, who and when.
- A Released document is locked; changing it creates a new revision.
- A Document can be flagged **public** (appears in Grab this) or shared to a customer through a project link.
- Change Management becomes the revision history of Documents, not a separate list.

### 2.7 One access model

| Who | Sees | How |
|---|---|---|
| Grant | Everything | Vault password |
| Customer | One project's released documents; can upload requested items | Expiring link per project (accounts only if later needed) |
| Public | Published documents and tools | Hub |
| Public agent | Published content only | Server-side limit |
| Vault assistant | Everything, read; writes need confirmation | Server-side tools |

### 2.8 One audit log

An append-only log of who did what to which record. It powers revision history, the cGMP trail, the assistant's action trail and "what changed" views. It replaces the separate Update List and Change Management lists.

### 2.9 One shell

Tabs are renamed so each maps to an object:

| New tab | Replaces | Holds |
|---|---|---|
| **Today** | (new) | What needs attention: new leads, overdue documents, follow-ups |
| **Inbox** | Log List | Leads |
| **Pipeline** | (new) | Opportunities by stage |
| **Projects** | Releases (part) | Active and completed projects |
| **Accounts** | Customers | Accounts and contacts |
| **Knowledge** | (new) | Research, articles, trips, notes |
| **Library** | (new) | Templates, checklists, work orders |
| **Registry** | Registry | Numbers, counters, VOID |
| **Settings** | Settings, Directory | Site settings, publishing (Apply), site map |

Archive becomes a filter, not a tab. The assistant and a global search bar are available on every screen.

### 2.10 One template engine

Project structures, document checklists, the cGMP document set, the Build this PDFs and Word documents, and reusable work orders are all Templates in Library. Adding a new project type means adding a template, not code.

### 2.11 cGMP documentation as an option

Block Concepts' own process is not cGMP. For a customer who operates under cGMP, the project gets an optional **cGMP documentation package**: a template that adds a `cGMP Package` subfolder under `Documentation - Project` and its required-document checklist. It supplies equipment information the customer can use in their own quality system.

- No approvals or electronic signatures inside the app. Signed documents are uploaded as Documents.
- Documents still have revisions and a locked Released state, so the customer can see exactly which version was supplied.
- No compliance claims. The customer owns their validation.

## 3. Stack (approved)

Hosting stays on Cloudflare, with more custom-built pieces:

- **D1** (SQL database) for records, links and the audit log.
- **R2** (file storage) for released and customer-shared documents, with checksums. Customers get files through expiring links from the app, so they never need OneDrive, SharePoint or Teams.
- **Vectorize** (or equivalent) for embeddings behind assistant search.
- **OneDrive** stays the working area for Word and Excel. Records link to OneDrive items through Microsoft Graph. A document that is shared or released is copied into R2.
- **Onshape** stays the design tool. Records store the Onshape share link, plus exported PDF or STEP snapshots as Documents.
- **Email:** a dedicated agent address (section 6).

- **Addresses:** `vault.blockconceptsllc.com` (Concepts Vault, private) and `hub.blockconceptsllc.com` (Concepts Hub, customer-accessible). See `docs/WORKFLOW.md` section 6.

This replaces decision D3 and the Power Automate backend in `concepts-vault-spec.md`.

## 4. Build order that pays back early

1. **Spine:** object model, Registry, Vault shell, Today.
2. **Pipeline and Accounts:** leads to opportunities, with Give this feeding the Inbox.
3. **Projects:** activation from a template, document checklist, completeness bar.
4. **Documents:** revisions, Released lock, PDF delivery through customer links, upload requests.
5. **Search and the Vault assistant** over records and documents.
6. **Knowledge:** items, links, trip plans.
7. **cGMP templates and approvals.**
8. **Public Hub:** Grab this, Build this, Ask this.
9. **Import and cutover** from the current tools.

Steps 1 to 5 are the part that would let you stop paying for separate tools.

## 5. Cautions

- **Large build.** Build in order of payback and keep the old tools until each piece is proven.
- **Money scope.** Replacing QuickBooks is different from replacing a CRM, because the books must be right. See section 8 and `docs/BOOKS.md`.
- **Assistant cost.** Capped monthly (section 7).
- **Gantt charts** start as stored and linked files. A simple timeline view comes later.

## 6. Agent email

A separate address (for example `agent@...`) that the platform reads, so your own mailbox stays out of it.

- **Newsletters and articles** forwarded to it become Knowledge items, summarized and tagged, with the source kept.
- **Invoices, POs and payment notices** are matched to a project and proposed as Documents and financial records. You confirm before they are filed.
- **Customer replies** are attached to the right opportunity or project activity feed.
- **Past-due and follow-up reminders** appear in Today. The assistant drafts messages; nothing is sent without your confirmation.
- **Recommendation to verify:** receive mail with Cloudflare Email Routing and an Email Worker on a subdomain, so your Outlook mail on the main domain is untouched. Send from a Microsoft 365 mailbox for the agent (or a transactional email service). Confirm both against your current DNS and mail setup before building.

## 7. Decisions made (round 2)

| Topic | Decision |
|---|---|
| Stack | Approved: Cloudflare D1 + R2 + Vectorize, OneDrive for working files. |
| Document hosting | The app (R2 with expiring links) for customer-facing files; OneDrive for working files. |
| Opportunity states | Open, Won, Lost. |
| Project stages | Design, Build, Install (then Closed). This replaces the old Build State list. |
| cGMP | An optional documentation package, not a process or a mode. No in-app signatures. |
| Assistant budget | Cap $20 per month now, raised to $60 once it replaces the apps. |
| Import | Manual entry of about 30 opportunities and 6 projects as the pilot. |
| Email | A new agent address, separate from yours. |
| Apps replaced | monday.com (CRM, projects). OneDrive for quoting docs stays for Word and Excel. Onshape stays for design; the platform links and shares. Outlook proposals and follow-ups move to the platform and the agent address. QuickBooks: replaced by the Vault's Books after a parallel run (section 8). TurboTax: stays; the Vault exports tax-ready totals. |

## 8. Money: QuickBooks and TurboTax

**Decision (updated):** Grant wants the Vault to replace QuickBooks for the accounting he actually uses, follow GAAP, and produce a categorized P&L. Details, controls and build order are in `docs/BOOKS.md`.

- The Vault becomes the books of record only after a parallel run beside QuickBooks and a CPA review. Until then QuickBooks stays.
- The ledger is double-entry and append-only, with locked periods and a source for every entry.
- TurboTax is not replaced. The Vault supplies tax-ready category totals and exports.
- Project financials (milestones, invoices, receivables, expenses) come first and feed the ledger.

## 9. Still open

1. The 7th and 8th apps (the list had six).
2. The required-document list for each folder in `docs/FOLDER-STRUCTURE.md` (the folders themselves are decided).
3. The agent email address and mailbox type.
4. The accounting questions in `docs/BOOKS.md` section 6.

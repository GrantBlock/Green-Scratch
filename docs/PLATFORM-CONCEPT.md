# Platform concept: one place for the day-to-day

**Status: proposal for Grant's review.** Nothing in `spec/` has been changed to match it yet. If approved, `PLAN.md` and the specs are rewritten around it (the current versions stay in git history).

## 1. What this is

A single private workspace (Concepts Vault) for running Block Concepts, with a thin public side (Concepts Hub). It replaces a stack of separate subscriptions with one data model, one search, one assistant.

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

Starter structure (to be replaced by Grant's real folders):

| Section | Typical documents |
|---|---|
| 01 Commercial | Quote, PO, contract, invoices |
| 02 Engineering | Specifications, drawings, BOM, ROI |
| 03 Schedule | Gantt, roadmap |
| 04 Procurement | Vendor quotes, order confirmations, certificates |
| 05 Build and test | FAT and SAT protocols and results |
| 06 Handover | Manuals, spec sheets, as-built |
| 07 Quality (cGMP projects only) | Requirements trace, qualification support, change history |
| 08 Correspondence | Emails, meeting notes |

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

### 2.11 cGMP support

Treated as a document set and traceability, not an app mode. A project flagged cGMP gets section 07 and extra required documents, tied to controlled revisions, approvals and the audit log.

The app supplies controlled documents and a trail. Customers own their validation. Claims such as "21 CFR Part 11 compliant" should not be made without a real assessment of signatures and access controls, ideally with a QA or regulatory reviewer.

## 3. Stack change needed

The current plan stores data as files behind the Vault and later syncs with OneDrive. A knowledge base, search, an audit log and an assistant need a real database.

**Proposed:** keep Cloudflare for hosting, and use:

- **D1** (SQL database) for records, links and the audit log
- **R2** (file storage) for released documents and checksums
- **Vectorize** (or equivalent) for embeddings behind assistant search
- **OneDrive** as the working-file store, synced to project folders through Microsoft Graph, including email-in

This replaces decision D3 and the Power Automate backend in `concepts-vault-spec.md`. It needs your approval.

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

## 5. Honest cautions

- **This is a large build.** A pipeline, project, document and knowledge system is real software. Build in the order above, keep the old tools until each piece is proven, and stop adding modules until the spine works.
- **Compare against what you pay for.** I don't know which eight apps you use. A line-by-line check of what each does for you will show whether this replaces them or just adds a ninth.
- **The assistant costs money per use** and needs a spend cap.
- **Gantt charts** are a real feature, not a free add-on. Start by storing and linking the gantt file, and build a simple timeline view later.

## 6. Decisions needed

1. **Which eight apps** are you replacing, and what do you actually use each for?
2. **Stack:** approve D1 + R2 + Vectorize + OneDrive sync in place of files plus Power Automate?
3. **Your real project folder structure** and required-document list, to replace the starter structure above.
4. **Pipeline stages** for an opportunity, from inquiry to won or lost.
5. **Email:** is Outlook (Microsoft 365) the mailbox the platform should read from and file into projects?
6. **cGMP:** which customers and regulations first, and signed approvals inside the app or outside it?
7. **Assistant budget:** a monthly cap.
8. **Existing data:** what needs importing (monday items, past quotes, research notes)?

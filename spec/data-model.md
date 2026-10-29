# Data Model: records, links and states

The single source for what a record is. Every tool (Inbox, Pipeline, Projects, Accounts, Knowledge, Library, Registry, the public Hub, the assistant) reads and writes these records. No tool adds its own record type. Context: `docs/PLATFORM-CONCEPT.md`. Stored in Cloudflare D1; files in R2; working files linked from OneDrive.

---

## Main Prompt: Common to every record

#### Additional Prompt: Common fields

- **Number:** issued by Registry (`BC-[TYPE]-YYNNN`), never reused, VOID when abandoned.
- **Type, title, status, created, updated.**
- **Tags:** free tags plus industry and pillar (Engineering, Sourcing, Services).
- **Links:** typed links to other records (for example Opportunity → Account, Project → Opportunity, Knowledge item → Account).
- **Activity:** an append-only feed of notes, emails and changes shown on the record. Replaces the separate Update List.
- **Attachments:** Documents linked to the record.
- **Archived flag:** archived records are hidden from active views and fully kept.
- **Audit:** every change writes an audit event (see below).

---

## Main Prompt: Records

#### Additional Prompt: Lead (`BC-D`)

An inbound inquiry from Give this, Ask this, Build this, email, phone or manual entry.

- Fields: source, name, company, email, phone, message, source context (entry or tool), received date, transcript or attached file.
- **Status:** New, Contacted, Qualified, Dismissed.
- **Qualify** creates or matches an Account and Contact, and creates an Opportunity (which issues its `BC-Q`).

#### Additional Prompt: Account and Contact

- Account: name, **kind** (Customer, Supplier, Prospect, Organization), three-letter Client Code (`GEN` for prospects), industry tags, website, notes.
- Contact: name, role, email, phone, primary flag. A contact belongs to one account.
- Accounts show every linked lead, opportunity, project, document and knowledge item.

#### Additional Prompt: Opportunity (`BC-Q`)

A qualified inquiry being quoted.

- Fields: account, contact, title, scope summary, estimated value, source lead, next action and due date, quote documents, decided date.
- **Status:** Open, Won, Lost. Lost requires a reason.
- A Lost opportunity keeps its number and stays searchable.
- **Won activates a Project.**

#### Additional Prompt: Project (`BC-B`)

An opportunity that was won. Number: the same `YYNNN` digits as its Q.

- Fields: account, opportunity, contract value, target dates, template used, cGMP option flag, OneDrive folder link, Onshape links.
- **Stage:** Design, Build, Install, Closed.
- **Activation** creates from the chosen Template: checklist items, Jobs, Milestones, and a OneDrive folder.
- **Completeness:** the share of required checklist items at Received or better, shown on the project.

#### Additional Prompt: Checklist item

- Fields: project, folder (one of the customer or project folders in `docs/FOLDER-STRUCTURE.md`), name, required flag, due date.
- **Status:** Missing, Requested, Received, In review, Released.
- **Upload request:** a one-item link that lets a customer upload a file to this item.

#### Additional Prompt: Job (`BC-J`)

- Fields: project, category (03 Electrical, 06 Mechanical, 09 Hardware, 12 Supplies, 15 Made-in, 18 Assembly, 21 Item, 24 Engineering, 27 DevOps), description, hours estimated and actual, start, target and actual dates.
- **Status:** Not started, In progress, Complete.

#### Additional Prompt: Milestone and financial records

- **Milestone:** project, name, percent (for example 60, 30, 10), amount, due date. Status: Pending, Invoiced, Paid.
- **PO:** customer PO number, amount, date, Document.
- **Invoice:** number, lines, amount, issued, due, paid date, Document. Status: Draft, Sent, Overdue, Paid. Overdue is computed from the due date. Posts to the ledger (see Books).
- The Vault is the books of record once the Books slices are proven (`docs/BOOKS.md`). Until cutover, QuickBooks remains the books and the Vault tracks and exports.

#### Additional Prompt: Event, Visit and Trip

- **Event:** kind (Customer visit, Supplier visit, Site measurement, Installation, Networking event, Trade show, Call, Other), date and time, location, accounts and contacts, linked opportunity or project, purpose, outcome notes, photos.
- **Trip:** a group of Events (for example a Pack Expo week). Holds travel notes and links to Knowledge items.
- People met at a networking event can be turned into Leads.
- Events appear on the Calendar and in Today. They can be offered to Outlook as a calendar feed.

#### Additional Prompt: Schedule item and Baseline

- **Schedule item:** project, name, **category** (dropdown: Design, Sourcing, Build, Install, and others defined in Settings), start, end, dependencies, percent complete, owner. Has its own Updates feed.
- **Baseline:** a named snapshot of all schedule items of a project (name, date). The Gantt compares a baseline with the current plan.
- Changing a date requires a reason, recorded in the item's Updates.
- Grouping is a view setting; category is the data.

#### Additional Prompt: Sourcing item

- Fields: project, description, supplier (an Account), quote requested date, quote received (Document), price, lead time, status (To quote, Quoted, Ordered, Received), PO number.
- This is Grant's list of what is being bought and from whom on each project.

#### Additional Prompt: Expense

- Fields: date, amount, vendor, category, project or Overhead, receipt (Document), source (agent email or manual), reimbursable flag.
- Expenses roll up to project cost and to a monthly export for the accountant.

#### Additional Prompt: Books (ledger)

Defined in `docs/BOOKS.md`. Name note: the customer-side record is an **Account**; the accounting record is a **Ledger account**.

- **Ledger account:** code, name, type (Asset, Liability, Equity, Revenue, Expense), category, **cash-flow class** (Operating, Investing, Financing, Cash), tax-line mapping, active flag.
- **Journal entry:** date, memo, source record (Invoice, Bill, Payment, Expense, Bank transaction, manual), status (Posted, Reversed), period. Has **lines**: ledger account, debit or credit amount, optional Project and Account (customer or supplier). Debits must equal credits.
- **Bill:** supplier (an Account), number, lines, amount, dates, status (Open, Paid), Document, optional Project. Posts to the ledger.
- **Payment:** direction (received or paid), amount, date, method, applied to Invoices or Bills.
- **Bank account and Bank transaction:** imported by manual upload of statement files (CSV, OFX, QFX) with a saved column mapping per account; duplicates detected; matched to Payments, Expenses or manual entries.
- **Reconciliation:** per bank account and month: statement ending balance, cleared items, difference. A month can close only at a zero difference. Exportable to Excel.
- **Period:** month, status (Open, Closed). Closed periods reject posting until reopened with a logged reason.
- **Reports** are computed from posted entries only: income statement (P&L), balance sheet, statement of cash flows, statement of members' or owner's equity, A/R and A/P aging, general ledger, trial balance, reconciliation report, and P&L by project. Every report exports to Excel (`.xlsx`). A period can hold accountant-supplied **notes** text.
- Entries are never edited or deleted; a reversing entry corrects a mistake.

#### Additional Prompt: Document (`BC-D`)

- Fields: title, kind (Quote, PO, Invoice, Manual, Spec sheet, Gantt, ROI, Roadmap, Drawing, Certificate, Report, Other), linked record, file reference (R2 key, OneDrive item, or Onshape link), checksum.
- **Revision** number and **status:** Draft, In review, Released, Superseded.
- A Released document is locked; changing it creates a new revision. Older revisions stay.
- **Visibility:** Private, Customer-shared (through a project link), or Public (appears in Grab this).

#### Additional Prompt: Knowledge item (`BC-K`)

- Kinds: Application research, Sales research, Article, Trip plan, Note, and the assistant's standing context: **Configuration**, **Glossary**, **Standard work**.
- **Scope** of an assistant-context item: Company (no link), Customer (linked to an Account) or Project (linked to a Project). More specific scope wins. See `docs/FOLDER-STRUCTURE.md` section 3.
- Assistant-context items are never Customer-shared or Public, and are not editable through share links.
- Fields: body (Markdown), source URL or email, summary (assistant-written summaries are labeled), links.
- **Trip plan:** dates, locations, itinerary items, accounts visited.
- Items arrive by manual entry, web clip, upload, or the agent email.

#### Additional Prompt: Template (`BC-L`)

- Kinds: Customer structure, Project structure, Checklist, Document template, Work order. The folder trees are in `docs/FOLDER-STRUCTURE.md`.
- Stored as definitions, so a new project type is a new Template, not new code.
- The **cGMP documentation package** is a Template that adds a `cGMP Package` subfolder under `Documentation - Project` and its items.

#### Additional Prompt: Email message

- Ingested from the agent address: sender, subject, received, class (Newsletter, Invoice, PO, Customer, Other), proposed links, raw message stored.
- Filing into a record needs Grant's confirmation.

#### Additional Prompt: Share link

- Project, scope (view released documents, or upload to one checklist item), expiry, created, revoked flag, last used.
- A share link exposes only Customer-shared Documents of its project. It is served by the Hub (`hub.blockconceptsllc.com`), never by the Vault.

#### Additional Prompt: Audit event

- Actor (Grant, assistant, share link, system), action, record, before and after, timestamp. Append-only.

---

## Main Prompt: Lifecycle and states

```
Lead --qualify--> Opportunity (Open) --win--> Project (Design -> Build -> Install -> Closed)
                                     \--lose--> Opportunity (Lost)
```

- Events, schedule items, sourcing items and expenses are numbered as part of their project or account and need no Registry serial of their own.
- Registry numbers: Lead `BC-D`, Opportunity `BC-Q`, Project `BC-B` (same digits), Job `BC-J`, Document `BC-D`, Knowledge item `BC-K`, Template `BC-L`, Web configuration `BC-W`.
- The earlier Build State list (Quoting, Designing, Purchasing, Manufacturing, Assembling, Completed) and the earlier Status list on Give this rows (New, Contacted, Quoted, Closed) are replaced by the states above.
- Registry numbers are internal. A customer sees the document number on their own quote, and the drawing number on sheets.

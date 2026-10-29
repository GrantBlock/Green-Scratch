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

- Account: name, three-letter Client Code (`GEN` for prospects), industry tags, website, notes.
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

- Fields: project, section (01 Commercial, 02 Engineering, 03 Schedule, 04 Procurement, 05 Build and test, 06 Handover, 07 cGMP package, 08 Correspondence), name, required flag, due date.
- **Status:** Missing, Requested, Received, In review, Released.
- **Upload request:** a one-item link that lets a customer upload a file to this item.

#### Additional Prompt: Job (`BC-J`)

- Fields: project, category (03 Electrical, 06 Mechanical, 09 Hardware, 12 Supplies, 15 Made-in, 18 Assembly, 21 Item, 24 Engineering, 27 DevOps), description, hours estimated and actual, start, target and actual dates.
- **Status:** Not started, In progress, Complete.

#### Additional Prompt: Milestone and financial records

- **Milestone:** project, name, percent (for example 60, 30, 10), amount, due date. Status: Pending, Invoiced, Paid.
- **PO:** customer PO number, amount, date, Document.
- **Invoice:** number, amount, issued, due, paid date, Document, external reference (for QuickBooks). Status: Draft, Sent, Overdue, Paid. Overdue is computed from the due date.
- The platform tracks and reminds. QuickBooks (or the accountant's tool) remains the books of record. A monthly export is produced.

#### Additional Prompt: Document (`BC-D`)

- Fields: title, kind (Quote, PO, Invoice, Manual, Spec sheet, Gantt, ROI, Roadmap, Drawing, Certificate, Report, Other), linked record, file reference (R2 key, OneDrive item, or Onshape link), checksum.
- **Revision** number and **status:** Draft, In review, Released, Superseded.
- A Released document is locked; changing it creates a new revision. Older revisions stay.
- **Visibility:** Private, Customer-shared (through a project link), or Public (appears in Grab this).

#### Additional Prompt: Knowledge item (`BC-K`)

- Kinds: Application research, Sales research, Article, Trip plan, Note.
- Fields: body (Markdown), source URL or email, summary (assistant-written summaries are labeled), links.
- **Trip plan:** dates, locations, itinerary items, accounts visited.
- Items arrive by manual entry, web clip, upload, or the agent email.

#### Additional Prompt: Template (`BC-L`)

- Kinds: Project structure, Checklist, Document template, Work order.
- Stored as definitions, so a new project type is a new Template, not new code.
- The **cGMP documentation package** is a Template that adds section 07 items.

#### Additional Prompt: Email message

- Ingested from the agent address: sender, subject, received, class (Newsletter, Invoice, PO, Customer, Other), proposed links, raw message stored.
- Filing into a record needs Grant's confirmation.

#### Additional Prompt: Share link

- Project, scope (view released documents, or upload to one checklist item), expiry, created, revoked flag, last used.
- A share link exposes only Customer-shared Documents of its project.

#### Additional Prompt: Audit event

- Actor (Grant, assistant, share link, system), action, record, before and after, timestamp. Append-only.

---

## Main Prompt: Lifecycle and states

```
Lead --qualify--> Opportunity (Open) --win--> Project (Design -> Build -> Install -> Closed)
                                     \--lose--> Opportunity (Lost)
```

- Registry numbers: Lead `BC-D`, Opportunity `BC-Q`, Project `BC-B` (same digits), Job `BC-J`, Document `BC-D`, Knowledge item `BC-K`, Template `BC-L`, Web configuration `BC-W`.
- The earlier Build State list (Quoting, Designing, Purchasing, Manufacturing, Assembling, Completed) and the earlier Status list on Give this rows (New, Contacted, Quoted, Closed) are replaced by the states above.
- Registry numbers are internal. A customer sees the document number on their own quote, and the drawing number on sheets.

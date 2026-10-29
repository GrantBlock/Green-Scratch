# Folder structure

Source: Grant's `Folder_Structure.xlsx`, plus a new **Claude** section. This is the structure for every customer and every project. The Vault creates it automatically and keeps it in step with the records.

## 1. Customer level

One folder per customer account, created when the account is created. Folder names keep Grant's wording.

| Folder | Purpose (Grant's description) | Records that map here |
|---|---|---|
| `Archive - Customer` | Obsolete files | Superseded and archived documents |
| `Finance, Sales, and Servicing - Customer` | General | POs, invoices, payment records, service records |
| `Inbox - Customer` | Quick access | Files just received, waiting to be filed (including from the agent email) |
| `Documents - Customer` | Sales and project documents | Quotes, proposals, ROIs, process documents, contracts |
| `Temp - Customer` | Temporary user folders | Scratch space; not indexed, not shared |
| `Project - Customer` | One subfolder per project | See section 2 |
| `Claude - Customer` (new) | Assistant context for this customer | See section 3 |

## 2. Project level

Inside `Project - Customer`, one folder per project, named with its Registry number and a short title, for example `BC-B-26042 Cap Torque Station`. Created when an opportunity is Won. Each project holds:

| Folder | Purpose (Grant's description) | Records that map here |
|---|---|---|
| `Customer Correspondence` | Layouts, specs, manufacturing info | Customer layouts, requirement specs, emails and notes |
| `Documentation - Project` | Source files | Manuals, spec sheets, Gantt exports, roadmaps, handover documents |
| `Electrical - Project` | Source files | Electrical drawings, panel layouts, wiring, PLC files |
| `Mechanical - Project` | Source files | Onshape exports (PDF, STEP), mechanical drawings, BOMs |
| `Temp - Project` | Temporary user folders | Scratch space; not indexed, not shared |
| `Supplier Correspondence` | Data sheets, quotes | Supplier quotes, data sheets, order confirmations |
| `Claude - Project` (new) | Assistant context for this project | See section 3 |

Assumption: the six project folders from the sheet repeat inside every project folder. Say so if the sheet meant something else.

The optional **cGMP documentation package** is a subfolder `cGMP Package` created inside `Documentation - Project` when a project has the cGMP option. (Assumption; change if you prefer another place.)

## 3. The Claude section

Where the assistant's standing knowledge lives. There are three levels, and the most specific one wins when they disagree.

| Level | Folder | Where it sits |
|---|---|---|
| Company | `Claude - Company` | Next to the customer folders, at the top of the file store |
| Customer | `Claude - Customer` | Inside each customer folder |
| Project | `Claude - Project` | Inside each project folder |

Each Claude folder holds three kinds of files, written in Markdown so both Grant and the assistant can read and edit them:

1. **Configuration** (`config.md`): standing instructions for the assistant at that level.
   - Company: how Block Concepts speaks and works, output formats, things never to do (the website's copy rules).
   - Customer: who the people are, how they like to be addressed, requirements, approval habits.
   - Project: the scope in brief, current stage, key people, constraints, what the assistant should check before drafting anything.
2. **Glossary** (`glossary.md`): terms, abbreviations, part and station names, with plain definitions. A project glossary overrides a customer glossary, which overrides the company glossary.
3. **Standard works** (`standard-works/`): the way Block Concepts does a repeatable task, one file each. Examples: quote preparation, site measurement, supplier quote request, follow-up and payment reminder cadence, factory acceptance test, handover pack. A customer or project can hold a variant that records how it differs from the company standard.

How the assistant uses them:

- When a project is open, the assistant loads that project's configuration and glossary, then the customer's, then the company's.
- When drafting or advising on a task, it looks up the matching standard work and follows it, and says which one it used.
- The assistant may propose edits to these files. Grant approves before anything changes. Edits are versioned.
- These files are instructions, so they are never shared with customers and never served by the Hub. The public Assistant uses only a separate, published glossary.
- Text copied from emails, articles or uploaded files is never placed in these folders automatically.

Source of truth: the files in the Claude folders. The Vault indexes them when they change (so the assistant reads from the index, not from OneDrive on every question) and shows them under a **Claude** area in the Vault, where they can also be edited. Check sync delay when this is built.

## 4. How it connects to the rest of the app

- Where files live: OneDrive holds the working folders above. When a document is Released and shared with a customer, a copy goes to the Hub's storage (see `docs/WORKFLOW.md` section 6). The `Temp` and `Inbox` folders are never published.
- The Vault creates the customer folders when an Account is created, the project folder when an Opportunity is Won, and the Claude folders at the same moments from the company defaults.
- The required-document checklist is now defined per folder (for example, `Finance, Sales, and Servicing - Customer` expects a PO and invoices). The list of required documents per folder is still to be supplied.
- `Archive - Customer` receives Superseded documents and archived records' files.
- Folder names, and which folders exist, are a Template (kind: Customer structure, and Project structure) in the Library, so a change is edited, not coded.

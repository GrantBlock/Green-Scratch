# Design system: status, coverage and gaps

The Block Concepts design system is authored in Claude Design and exported into `design/system/`. It is the **only** source of branding for the Hub, the Vault and every tool. Read, in order: `design/system/README.md`, `application.md` (apps), `print-drawings.md` (drawing sheets), `website.md`, `word-documents.md`.

## Round 1: delivered (second export)

Everything asked for in `GAPS-PROMPT-round1-done.md` is in the system:

| Round 1 item | Delivered as |
|---|---|
| Form controls | `TextField`, `SelectField`, `TextArea`, `FileDrop`, `Checkbox`, `Radio`, `SearchField` |
| Navigation lists | `TabBar`, `ListBox`, `ButtonColumn` |
| Status colors, pill, dropdown | Tokens `bc-tone-*`, `bc-status-*`, `bc-build-*`, `bc-feedback-*`; `StatusPill`, `StatusSelect` |
| Log table | `LogTable` |
| Detail pane | `DetailPane`, `PdfPreview` |
| Layouts | `GrabLayout`, `FixLayout`, `VaultShell`, `BuilderLayout` |
| Feedback and overlays | `Modal`, `ConfirmDialog`, `Toast`, `StateMessage`, `StagedBar` |
| Station builder | `StepRail`, `ConfigBar`, `StationCard`, `AddStation`, `LayoutPreview`, `WelcomeScreen` |
| Chat | `ChatWindow` |
| Drawing sheets | `DrawingSheet`, `StationBox`, `DrawingLine`, `FlowArrow`, `DrawingLegend`, `ScheduleTable`, `ProcessList`, plus `print-drawings.md` |
| Word process document | Template section in `word-documents.md` |
| Favicons and pattern guidance | `assets/Favicons/`, pattern table in `application.md` |

## Mismatch: built to the older spec

The export follows the earlier Vault and Hub spec, before the platform concept. These parts are out of date:

| In the design system | Platform now |
|---|---|
| `VaultShell` has six fixed tabs: Log List, Releases, Directory, Customers, Settings, Registry. `TabBar` allows six or fewer, with type shrinking to 9px | Nine tabs: Today, Calendar, Pipeline, Projects, Accounts, Money, Knowledge, Library, Settings |
| Status states: New, Contacted, Quoted, Closed; Build State Quoting to Completed | Lead, Opportunity, Project stage, Checklist, Document, Invoice, Milestone, Job and Sourcing states (see round 2) |
| Names: Grab this, Fix this, Give this, Build this, Ask this, Log List | Library, Hub home, Contact, Builder, Assistant, Inbox |
| `StatusPill` says "Do not invent new states or colors" | The system must be extended with the new states |
| Screens: Log List and Grab this only | The Vault screens in `design/BRIEF.md` |

Component names (`GrabLayout`, `FixLayout`) are internal and may stay. Visible copy, tab labels and default text must use the platform names (`docs/WORKFLOW.md` section 4).

## Round 2: still missing

Paste `design/GAPS-PROMPT-2.md` into the design-system session.

1. **Navigation for nine Vault tabs** on desktop, iPad and phone (side rail plus bottom bar or overflow); rename the shell and its labels.
2. **New state sets** (Lead, Opportunity, Project stage, Checklist, Document, Invoice, Milestone, Job, Sourcing), plus overdue and days-late indicators.
3. **Gantt chart:** categories, dependencies, percent complete, baseline overlay, reason prompt on date change, touch operation. (`ScheduleTable` is the drawing schedule, not a Gantt.)
4. **Calendar:** week and agenda views, event kinds, add-event sheet, trips.
5. **Pipeline:** list and board with opportunity cards and a won/lost action with reason.
6. **Today feed** of items needing attention.
7. **Record page pattern:** header with number, title, state and actions; sub-tabs; Updates feed; link chips.
8. **Project documents:** folder checklist with completeness bar and per-item status, upload request.
9. **Money:** receivables table with days overdue, milestone list, invoice composer, expense entry with receipt capture. Later, ledger and reconciliation tables and a statement report layout.
10. **Vault Assistant panel:** side panel and phone sheet with citations, proposed actions (Confirm and Cancel), spend meter, role chips.
11. **Customer project page (Hub):** documents by folder, download, upload slots, expiry notice.
12. **Knowledge:** list, Markdown item view, trip itinerary.
13. **Claude section editor** with version history.
14. **Global search or command bar.**
15. **Word invoice template** (for later).

## Decisions made

1. Vault theme: `dark`, same as the Hub.
2. Hub has its own header, on `hub.blockconceptsllc.com`.
3. The website is the single source of truth for pillars and positioning.
4. Build this produces both the PDF drawing sheets and the Word process document.

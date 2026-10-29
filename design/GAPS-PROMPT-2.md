# Prompt for the design-system session: round 2

Paste everything below the line into the Claude Design session that built the Block Concepts design system. After it finishes, re-export and replace `design/system/` in this repo.

---

The first additions are good. Now bring the application components in line with the current platform and add what is still missing. Keep every existing rule (dark theme for both apps, Steel Blue as the only blue, square and flat, no shadows or gradients, Overpass, 44px targets, 2px focus outline, reduced motion, copy rules). Keep existing tokens and components working; extend them. For each addition provide a component folder with `README.md` and `preview.html`, tokens in `tokens.json` and `tokens.css`, and updated `bundle.js`, `bundle.css`, `index.d.ts` and `README.md`. Update `application.md` to match.

Design for **phone and iPad first** (touch, no hover-only controls), then desktop.

## 1. Rename and re-scope

Names are changing. Use these everywhere visible (tab labels, default text, previews):
- Private app: **Concepts Vault** with tabs **Today, Calendar, Pipeline, Projects, Accounts, Money, Knowledge, Library, Settings**.
- Public app: **Concepts Hub** with tools **Contact, Builder, Library, Assistant**.
- Retired names: Log List (now **Inbox**, a list of new leads), Releases, Directory, Customers (now **Accounts**), Registry (shown as numbers on records), Grab this (now **Library**), Fix this (now **Hub home**), Give this (now **Contact**), Build this (now **Builder**), Ask this (now **Assistant**).

## 2. Navigation for nine tabs

`TabBar` and `VaultShell` cannot hold nine tabs. Provide a Vault navigation that works at three sizes: a persistent side rail on desktop and iPad landscape, a collapsible rail on iPad portrait, and a bottom bar with the first four items plus a "More" sheet on phones. Include an icon-free active state (Steel Blue marker plus bold label), a global search field and an Assistant button in the header, and a "New" menu (lead, opportunity, visit, expense).

## 3. State sets

Extend `StatusPill` and `StatusSelect` (same rules: label plus marker, never color alone, no new hues beyond the five tones). Add:

| Group | States |
|---|---|
| Lead | New, Contacted, Qualified, Dismissed |
| Opportunity | Open, Won, Lost |
| Project stage | Design, Build, Install, Closed |
| Checklist item | Missing, Requested, Received, In review, Released |
| Document | Draft, In review, Released, Superseded |
| Invoice | Draft, Sent, Overdue, Paid |
| Milestone | Pending, Invoiced, Paid |
| Job | Not started, In progress, Complete |
| Sourcing item | To quote, Quoted, Ordered, Received |

Also a "days overdue" indicator (for example "12 days late") and a completeness bar (percent of required documents received) in the same style.

## 4. Gantt chart

A project schedule chart: rows of schedule items with a **Category** dropdown (not groups; grouping is a view option), start and end bars, dependencies (simple connector lines), percent complete, a **baseline overlay** that compares a named snapshot with the current plan, a "today" line, and a **reason prompt** when a bar is moved. A line-item updates feed opens from each row. Must work by touch on iPad (drag and resize with 44px handles, plus an edit form as a fallback). Include zoom (week, month) and a baseline picker.

## 5. Calendar

Week view and agenda list views, event kinds (customer visit, supplier visit, site measurement, installation, networking event, trade show, call), a trip grouping, an add-event sheet, and a Today strip. Status of an event uses a marker, not only color.

## 6. Pipeline

List view and a three-column board (Open, Won, Lost) of opportunity cards (account, title, value, next action and due date). A "Mark won" and "Mark lost" action; Lost asks for a reason. An Inbox list of new leads above it with a Qualify action.

## 7. Today feed

A list of items needing attention grouped by type (new leads, follow-ups due, overdue invoices sorted by days late, visits, missing documents), each opening its record, with a swipe or button to snooze or mark done.

## 8. Record page pattern

A header with the record number, title, state pill and actions; sub-tabs for the record's sections; an **Updates feed** (timestamped notes, system events, emails) with an add-note field; link chips to related records. This pattern is reused for opportunities, projects, accounts and documents.

## 9. Project documents

A folder-by-folder checklist (the folders are: for customers, Archive, Finance Sales and Servicing, Inbox, Documents, Temp, Project, Claude; for projects, Customer Correspondence, Documentation, Electrical, Mechanical, Temp, Supplier Correspondence, Claude), each item with its status pill, a file list with revision and status, an upload control, a "Request from customer" action, and a **completeness bar** for the project.

## 10. Money

Receivables table (invoice, customer, due date, days overdue, amount, a "Draft reminder" action), milestone list (name, percent, amount, status), an invoice composer reviewed before sending, and expense entry with receipt photo capture and a category dropdown. For later, ledger and reconciliation tables (upload statement, match items, show the difference) and a financial statement report layout that prints cleanly and exports to Excel.

## 11. Vault Assistant panel

A side panel on desktop and a full-height sheet on phone: message list with **citations** that link to records, **proposed actions** with Confirm and Cancel, a monthly **spend meter** against a cap, and role chips (Quoting, Building, Supporting). Reuse `ChatWindow` where possible. Public Assistant keeps the existing notice.

## 12. Customer project page (Hub)

A minimal, link-only page: project name and number, documents grouped by folder with download buttons, upload slots for requested items, and a link-expiry notice. No navigation to anything else. Use the Hub home look.

## 13. Knowledge and Claude section

A Knowledge list with kinds (application research, sales research, article, trip plan, note), a Markdown item view, and a trip itinerary view. A Markdown editor with **version history** for the Claude section (configuration, glossary, standard works), with a banner stating these files are instructions for the assistant.

## 14. Word invoice template

Add an invoice template to `word-documents.md` and a matching PDF layout: logo and document number top left, bill-to, milestone lines, totals, payment terms, remit-to.

## 15. Check

Review every new component at phone width and on iPad; confirm contrast in the dark theme and that nothing relies on color alone.

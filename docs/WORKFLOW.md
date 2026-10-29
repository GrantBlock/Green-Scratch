# Workflow: how Grant actually works, and what the app must do

Source: Grant's own description (Oct 2026). This is the requirements base. It outranks the older specs wherever they differ.

## 1. The week, in Grant's words

1. **Schedule:** visits this week or next with new or existing customers and suppliers; on-site visits for measurements or installations; networking events such as local ones and Pack Expo.
2. **Work:** Onshape design; contacting manufacturers on current projects.
3. **Money:** ask for money, monitor expenses, see who has not paid.

## 2. What the app must do for each part

| Part of the week | The app provides |
|---|---|
| Schedule visits | A **Calendar** of visits and events, each tied to an account, a purpose and an outcome. Grouped into **trips** when several visits go together. Visible on phone and iPad. |
| On-site measurements and installs | Visit types for Site measurement and Installation, linked to a project, with notes and photos attached afterward. |
| Networking events | Event records (Pack Expo, local events) with the people met, who become leads. Prep and follow-up notes live on the event. |
| Onshape design | Links to Onshape documents on the project, plus exported PDF or STEP snapshots stored as Documents. Design stays in Onshape. |
| Contacting manufacturers | **Sourcing** list per project: item, supplier, quote requested, quote received, price, lead time, ordered, received. Supplier quotes are stored as Documents. |
| Ask for money | A **Receivables** view: invoices sent, due date, days overdue, one-click draft of a payment reminder for Grant to review and send. |
| Monitor expenses | **Expenses** logged by forwarding receipts to the agent email or by hand, categorized and tied to a project or to overhead. |
| See who has not paid | Overdue invoices surface in **Today**, sorted by days late. |

## 3. What to keep and fix from monday.com

Keep:

- **Gantt with snapshots and adjusted schedules.** Each project has a schedule of line items with start, end, dependencies and percent complete. A **baseline** is a named snapshot (for example "Contract" or "Revised after PO"). The Gantt shows the baseline against the current plan. Moving a date asks for a reason and writes it to the line item.
- **Updates on a line item.** Every line item has its own update feed. The same feed exists on every record.

Fix:

- **Categories, not groups.** Items have a **Category** dropdown (Design, Sourcing, Build, Install, and so on). Grouping is a view option, not the structure.
- **Phone and iPad first.** The whole app is a responsive installable web app tested on iPad and iPhone. Touch targets are at least 44px. The Gantt supports touch.
- **Invoices are reviewed, not auto-scheduled.** When a milestone is reached, the app proposes the invoice. Grant reviews and sends. Nothing is sent on a timer.
- **Integrations are built in,** not configured: email, calendar and files are part of the app.

## 4. Plain names

All "___ this" names are dropped.

| Old name | New name | What it is |
|---|---|---|
| Concepts Vault | **Workspace** (private) | Where Grant works |
| Concepts Hub | **Tools** (public section of the website) | Public pages beyond the main site |
| Fix this | Tools | Landing page for public tools |
| Grab this | **Library** | Public documents people can download |
| Give this | **Contact** | Contact form that creates a lead |
| Build this | **Builder** | Process document builder, internal first, then public |
| Ask this | **Assistant** | Chat: public one (limited) and the Workspace one (full) |
| Develop this | **Process** | How a project runs; to be written |
| Log List | Inbox | New leads |
| Update List | Updates | Feed on every record |
| Releases | Documents | Revisions and delivery |
| Customers | **Accounts** | Customers, suppliers, prospects |

Workspace tabs: **Today, Calendar, Pipeline, Projects, Accounts, Money, Knowledge, Library, Settings.** (Registry numbers show on each record; the full list is in Settings.)

## 5. Public tools are in scope

Grant wants the public tools fully working, and internal use comes first:

- **Builder** is used internally from an opportunity to produce a process document for a quote (PDF sheets and a Word document). Later it is opened to the public.
- **Library** starts as the internal place to publish customer-ready PDFs, then the public view is turned on.
- **Contact** is the first public piece, since it feeds the Pipeline.
- **Assistant (public)** comes last. It sees only published content.

## 6. Where the Workspace lives

Options, to decide later:

1. **`app.blockconceptsllc.com`:** simplest, and separate from the live site.
2. **`work.blockconceptsllc.com`:** same idea, a plainer name.
3. **A path on the main domain** (for example `/app`): one hostname, but it couples the private app to the public site's deploy.

Customer project pages can sit on the same host, or on a separate one such as `projects.blockconceptsllc.com` so a customer link never exposes the Workspace address.

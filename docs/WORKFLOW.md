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

All "___ this" names are dropped. The two sides keep their original names, Concepts Vault and Concepts Hub; the tools inside them use the plain names below.

| Old name | New name | What it is |
|---|---|---|
| Concepts Vault | **Concepts Vault** (short form: Vault), private | Where Grant works |
| Concepts Hub | **Concepts Hub** (short form: Hub), public | The public section of the website for tools and documents |
| Fix this | Hub home | Landing page for the public tools |
| Grab this | **Library** | Public documents people can download |
| Give this | **Contact** | Contact form that creates a lead |
| Build this | **Builder** | Process document builder, internal first, then public |
| Ask this | **Assistant** | Chat: a public one (limited) in the Hub and a full one in the Vault |
| Develop this | **Process** | How a project runs; to be written |
| Log List | Inbox | New leads |
| Update List | Updates | Feed on every record |
| Releases | Documents | Revisions and delivery |
| Customers | **Accounts** | Customers, suppliers, prospects |

Vault tabs: **Today, Calendar, Pipeline, Projects, Accounts, Money, Knowledge, Library, Settings.** (Registry numbers show on each record; the full list is in Settings.)

## 5. Public tools are in scope

Grant wants the public tools fully working, and internal use comes first:

- **Builder** is used internally from an opportunity to produce a process document for a quote (PDF sheets and a Word document). Later it is opened to the public.
- **Library** starts as the internal place to publish customer-ready PDFs, then the public view is turned on.
- **Contact** is the first public piece, since it feeds the Pipeline.
- **Assistant (public)** comes last. It sees only published content.

## 6. Addresses (decided)

| Address | What it is | Who uses it |
|---|---|---|
| `blockconceptsllc.com` | The live website (unchanged) | Everyone |
| `vault.blockconceptsllc.com` | Concepts Vault, the private working app | Grant only |
| `hub.blockconceptsllc.com` | Concepts Hub, the customer-accessible side: public tools (Contact, Builder, Library, Assistant) and customer project pages | Customers and the public |

Why separate addresses matter:

- **Isolation.** The Vault and the Hub are different origins, so a customer page can never share cookies, scripts or sessions with the Vault.
- **Least access.** The Hub does not read the Vault's database. It only reaches what the Vault has published or shared, through a narrow internal interface. The Vault copies files into a separate Hub storage bucket only when they are Released and Customer-shared or Public.
- **Login.** The Vault sits behind a login on its own address. Cloudflare Access (one-time email code, no password to build) is the likely option; confirm it against the plan and pricing before relying on it.
- **Website link.** At release the main website adds a Hub link in its navigation pointing to `hub.blockconceptsllc.com`. Until then the website does not mention the Hub.
- **Contact form.** The form can live on the Hub and be linked from the website, which avoids changing the live site's build. If it must sit on the main site, it posts to the Hub with cross-origin rules.
- **Agent email** uses its own address on a separate subdomain, so Outlook mail on the main domain is untouched.

Both subdomains need DNS records in Cloudflare and are served by Cloudflare Workers.

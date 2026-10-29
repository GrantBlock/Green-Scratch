# Claude Design brief: Concepts Vault and Concepts Hub

Run this in Claude Design after the design system has been extended with `design/GAPS-PROMPT-2.md` (round 1 is already in `design/system/`).

## Ground rules

- Use the Block Concepts design system in `design/system/` and nothing else. The `dark` theme, Overpass and Overpass Mono, Steel Blue as the only blue, square and flat (radius at most 4px), no shadows, no gradients. If something is missing from the design system, flag it instead of improvising.
- **Phone and iPad first.** Design each screen at phone width (about 400px), iPad (portrait and landscape) and desktop. Touch targets at least 44px. No hover-only controls.
- **Plain names.** Use these and no others: Concepts Vault (private) and Concepts Hub (public). Vault tabs: Today, Calendar, Pipeline, Projects, Accounts, Money, Knowledge, Library, Settings. Hub tools: Contact, Builder, Library, Assistant.
- **Copy:** sentence case except where a style is uppercase; no emoji, no exclamation marks, no superlatives; never name real customers, suppliers or places; use realistic placeholder data that is clearly marked as example data.
- **Two addresses.** Vault is `vault.blockconceptsllc.com` and is for one person. Hub is `hub.blockconceptsllc.com` and is for customers and the public. Give Hub screens the public site's look and Vault screens a denser working look, from the same tokens.
- Accessibility: WCAG 2.1 AA in the dark theme, keyboard operable, status never shown by color alone.
- Records and fields: `spec/data-model.md`. Workflow: `docs/WORKFLOW.md`. Folders: `docs/FOLDER-STRUCTURE.md`.

## Concepts Vault screens

1. **Sign-in.** Single field flow (emailed one-time code). Calm, minimal.
2. **App shell.** Header with wordmark, global search and an Assistant button; tab bar; on phone a bottom or collapsible navigation. A "new" button for lead, opportunity, visit, expense.
3. **Today.** What needs attention: new leads, follow-ups due, overdue invoices (sorted by days late), visits today and this week, documents missing on active projects. Each item opens its record.
4. **Calendar.** Week and agenda views. Event kinds: customer visit, supplier visit, site measurement, installation, networking event, trade show, call. Trips group events. Add-event sheet.
5. **Pipeline.** Opportunities as a list and a board by status (Open, Won, Lost) with next action and due date. Inbox of new leads above it with a Qualify action. Opportunity detail: account, contact, scope, value, quote documents, updates feed, Mark won / Mark lost with reason.
6. **Projects.** List with stage (Design, Build, Install, Closed) and a completeness bar. **Project detail** tabs:
   - Overview (account, value, dates, stage, links to Onshape and OneDrive)
   - Documents (the folder structure from `docs/FOLDER-STRUCTURE.md` with a checklist per folder: Missing, Requested, Received, In review, Released; upload, request from customer, revisions)
   - Schedule (a **Gantt** with a Category dropdown, dependencies, percent complete, baseline compare, a reason prompt when a date changes, per-item updates; usable by touch)
   - Sourcing (item, supplier, quote requested, quoted, ordered, received)
   - Money (milestones, invoices, expenses, margin)
   - Jobs, Updates
   - Share (create an expiring customer link; see what is shared)
7. **Accounts.** List filtered by kind (Customer, Supplier, Prospect, Organization). Detail with contacts, opportunities, projects, documents, events, knowledge items.
8. **Money.** Receivables (invoices sent, due date, days overdue, draft reminder to review and send), Expenses (list, add with receipt photo, categorize, project or overhead), Invoice composer from a milestone (review before send). Later: Books, with a ledger, reconciliation (upload statement, match, difference), and statements with Excel export.
9. **Knowledge.** Kinds: application research, sales research, article, trip plan, note. List, search, item view, link to accounts, events and opportunities. Trip plan view with itinerary and accounts visited.
10. **Library (Vault).** Templates (customer and project folder structures, checklists, document templates, work orders), and the **Claude section**: company, customer and project configuration, glossary and standard works, with edit and version history.
11. **Assistant panel.** A side panel on desktop and a full-height sheet on phone. Shows citations to records, proposed actions with Confirm and Cancel, and a monthly spend meter against the cap. Role chips: Quoting, Building, Supporting.
12. **Settings.** Categories, templates, assistant cap, agent email, Apply/publish to the Hub, backups and export.

## Concepts Hub screens

1. **Hub home.** Short introduction and the four tools as a button column (about one fifth wide on desktop, stacked on phone) with the content area beside it.
2. **Contact.** Form: name, company, email, phone, message, optional file. Only email is validated. Confirmation state. Auto-filled context when arriving from another tool.
3. **Builder.** The process document builder: welcome, a two-column station builder with a sticky overhead layout preview and a proposed operation order, then the two printed sheets (overhead layout and process description). See `spec/process-document-builder-spec.md` (update pending to the new names and records).
4. **Library.** Public documents: tab bar, item list, entry list with a labelled search, detail pane with first-page preview, description, "when to use", download, revision selector and expand control. Phone flow: two-column menu, then full-width detail.
5. **Assistant (public).** Chat window with the notice "AI assistant, not a binding quote", streaming reply state, contact handoff prompt.
6. **Customer project page.** Reached by an expiring link. Project name and number, released documents grouped by folder with download buttons, upload slots for requested items, link expiry notice. No navigation to anything else.

## States to show on every screen

Empty, loading, error, and long-text overflow. Provide an offline notice on phone for the Vault.

## Out of scope for this round

Books screens beyond the Money tab sketch, cGMP package views, and the Develop/Process page (content to come).

# Session V1: Vault shell, Pipeline and Accounts

Address: `vault.blockconceptsllc.com`. One user (Grant). Dense working look.

Design:
1. **Sign-in:** emailed one-time code; lines pattern per `application.md`.
2. **App shell:** nine-tab navigation that works on desktop (side rail), iPad and phone (bottom bar with a More sheet); global search; Assistant button; New menu (lead, opportunity, visit, expense). The nine-tab navigation is a `NEEDS-DS` item.
3. **Today:** new leads, follow-ups due, overdue invoices (sorted by days late), visits, missing documents. Each item opens its record.
4. **Inbox and Pipeline:** Inbox of new leads with a Qualify action; Pipeline as list and board (Open, Won, Lost) with next action and due date.
5. **Opportunity record:** header (number, title, state), sub-tabs, Updates feed, link chips, quote documents, Mark won and Mark lost (reason required).
6. **Accounts:** list filtered by kind (Customer, Supplier, Prospect, Organization); account record with contacts, opportunities, projects, documents, events.

Data: Lead, Account and Contact, Opportunity in `spec/data-model.md`.

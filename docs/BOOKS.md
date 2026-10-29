# Books: replacing QuickBooks

**Status: decided direction, details open.** Grant wants the app to do the accounting he actually uses in QuickBooks (about 10% of it), follow GAAP, and produce a categorized P&L (income statement). This document sets the scope, the controls that keep the numbers right, and the build order.

## 1. Scope

Build the part Grant uses, not all of QuickBooks.

**In scope**

- **Chart of accounts** with categories (assets, liabilities, equity, revenue, expenses), editable in Settings.
- **Double-entry ledger.** Every transaction posts balanced debits and credits.
- **Customer invoices** from project milestones (60/30/10 and others), with payment tracking and A/R aging.
- **Bills and expenses** from suppliers and receipts (including those forwarded to the agent email), with A/P aging.
- **Payments** applied to invoices and bills.
- **Bank and credit-card transactions** imported from statement files, matched and reconciled.
- **Reports:** categorized P&L (income statement), by month, quarter, year and **by project**; balance sheet; cash flow; A/R and A/P aging; general ledger and trial balance.
- **Period close and locking,** so past months cannot change by accident.
- **Exports** for the accountant and the tax return: ledger, trial balance, and category totals mapped to tax lines.

**Out of scope for now**

- Payroll (use a payroll provider and post its summary).
- Tax filing (keep TurboTax or the accountant; the app supplies tax-ready category totals).
- Automatic bank feeds (a paid third-party service; file import comes first).
- Inventory, multi-currency, multi-entity, and the rest of QuickBooks.

## 2. Why this fits the app better than QuickBooks

Every invoice, bill and expense already belongs to a project, so **profit by project** (revenue, supplier cost, expenses, margin) comes without a second system. Milestones already exist, so invoices are proposed from them and you review before sending.

## 3. GAAP, stated plainly

- GAAP uses **accrual** accounting: revenue when earned, expenses when incurred, not when cash moves. Many small businesses keep cash-basis books for tax. The ledger can support either view, but the choice must be made on purpose.
- Revenue recognition for machine projects (when a milestone counts as earned) is a policy decision, not just software. It should be settled with a CPA.
- I can build the system and the reports. I am not your accountant. A CPA should approve the chart of accounts, the revenue recognition policy, and the first closed month before the app becomes your books.

## 4. Controls that keep the numbers right

1. **Balanced entries only.** The database rejects any journal entry where debits do not equal credits.
2. **Append-only ledger.** Entries are never edited or deleted. A mistake is fixed by a reversing entry, so the history stays.
3. **Closed periods are locked.** Posting into a closed period needs an explicit, logged reopen.
4. **Every entry points to its source** (invoice, bill, payment, bank transaction) and is written to the audit log.
5. **Reconciliation** against the bank statement each month; unmatched items are listed.
6. **Tests.** Automated tests check balancing, rounding to the cent, reversal, period lock and each report against known examples.
7. **Backups and full export** (ledger as CSV) on a schedule.
8. **Parallel run.** Run the app beside QuickBooks for at least one full quarter. Compare P&L, balance sheet and A/R line by line. Cut over only when they agree, and start the new books at a clean date (ideally the start of a fiscal year or quarter) with opening balances from QuickBooks.

## 5. Build order

These slices follow the monday.com cutover (slice 7) and build on the Money slice (6), which already tracks milestones, invoices, receivables and expenses.

| Slice | Delivers |
|---|---|
| B1 | Chart of accounts, ledger, journal entries, period locking, trial balance |
| B2 | Invoices, bills, expenses and payments post to the ledger; A/R and A/P aging |
| B3 | Bank and card import, matching, monthly reconciliation |
| B4 | Reports: categorized P&L (income statement), balance sheet, cash flow, P&L by project; accountant and tax exports |
| B5 | Parallel run beside QuickBooks, CPA review, opening balances, cutover |

Savings start at the end of B5, so B5 is the milestone to aim for. Until then, ask whether your current QuickBooks and monday.com plans are higher tiers than you use; a cheaper plan for a few months is a lower-risk way to cut cost during the build. Check current plan options with each vendor.

## 6. Questions that decide the details

1. **Who needs GAAP?** A lender, a customer, an investor, an auditor, or is it good practice? This sets how strict the policy must be.
2. **Accrual or cash** for the books, and which for tax?
3. **Entity and tax return:** single-member LLC (Schedule C), partnership, or S-corp? This sets the tax mapping of categories.
4. **Employees or payroll?** Sales tax to collect and file?
5. **Reports wanted:** income statement (P&L) is the same document as the profit and loss statement. Do you also want the balance sheet, cash flow, aging and profit by project?
6. **Bank and card accounts:** how many, and how do customers pay (check, ACH, card)?
7. **A CPA or bookkeeper** who will review the setup and the first closed period?
8. **QuickBooks history:** how many years to bring over, and what cutover date?

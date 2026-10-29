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
- **Full financial statements** (Grant's requirement: everything in GAAP):
  - **Income statement (P&L)**, categorized, by month, quarter and year, and **by project**
  - **Balance sheet**
  - **Statement of cash flows** (indirect method)
  - **Statement of members' or owner's equity** (contributions, distributions, net income)
  - **Notes:** a text area per period for the notes and policies the accountant supplies; the app does not write accounting disclosures
- **Supporting reports:** A/R and A/P aging, general ledger, trial balance, reconciliation report.
- **Period close and locking,** so past months cannot change by accident.
- **Excel exports for every report** (Grant's accountant wants everything in Excel). Each is a formatted `.xlsx` file with a header (company, report, period, basis, date generated), and the underlying rows so the accountant can re-total them. The general ledger and trial balance also export as CSV. Category totals are mapped to tax lines for the tax return.

**Out of scope for now**

- Payroll (use a payroll provider and post its summary).
- Tax filing (keep TurboTax or the accountant; the app supplies tax-ready category totals).
- Automatic bank feeds (decided: not needed; Grant uploads statement files by hand and reconciles every month).
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
8. **Parallel run through 2027.** QuickBooks stays the official books for 2027. The Vault keeps shadow books beside it. Each month and quarter, compare P&L, balance sheet and A/R line by line. Cut over only when they agree.

## 5. Running beside QuickBooks

Decision (Grant): use the Vault's accounting alongside QuickBooks first, and treat Books as a starting point. It does not need to be finished soon, and it does not drive the build order. The core app (slices 1 to 7) comes first.

- **QuickBooks stays the official books** until the Vault has been compared against it and the CPA agrees. The tax return, any financials shared with others, and the CPA's work come from QuickBooks.
- **The Vault keeps shadow books** from a chosen month-end, using QuickBooks' trial balance at that date as the opening balances. The goal is 2027, but the start month moves with the build. A full year of comparison is best; a full quarter is the minimum.
- **Cutover** happens at a year boundary, after the comparison agrees and the CPA signs off. The Vault's opening balances for the new year come from QuickBooks' closed prior year.
- **Double entry burden.** During the comparison, transactions exist in two systems. Recommended: create sales invoices, bills and expenses in the Vault first (from project milestones) and key the same items into QuickBooks; upload the bank and card statements into both. Full dual entry is the stronger test but more work.
- **QuickBooks plan:** check with the vendor and the CPA whether a cheaper plan is enough for a comparison year.

## 6. Build order

| Slice | Delivers |
|---|---|
| B1 | Chart of accounts, ledger, journal entries, period locking, trial balance |
| B2 | Invoices, bills, expenses and payments post to the ledger; A/R and A/P aging |
| B3 | Manual statement upload (CSV, OFX or QFX) with a saved column mapping per account, duplicate detection, matching, and a monthly reconciliation that must reach a zero difference before the month can close |
| B4 | Income statement, balance sheet, statement of cash flows, statement of equity, P&L by project, aging, ledger and trial balance, all exportable to Excel; tax-line mapping |
| B5 | Comparison beside QuickBooks (monthly and quarterly), CPA review, then cutover at a year boundary |

B1, B2 and B4 come first because they produce the statements; B3 follows.

## 7. Decisions made

- Full GAAP statement set (income statement, balance sheet, cash flows, equity), plus aging and profit by project.
- GAAP is good practice, not required by a lender, customer or investor. The books use the **accrual** basis.
- Every report exports to Excel for the accountant.
- Bank and card data come from statement files uploaded by hand, reconciled every month. No bank feeds.
- A month closes only after it is reconciled to a zero difference.
- **Accounts:** one checking account and one credit card. Customers pay by check or ACH into the checking account. No card processing.
- **Entity:** an LLC with two members.
- **Payroll:** Grant is the only person on payroll, and takes owner's distributions today. Moving to W-2 pay is planned. Payroll itself is handled by a payroll provider, and its summary is posted to the ledger.
- **History:** three years of QuickBooks history.

What these mean for the design:

- **Two members.** An LLC with two members is normally taxed as a partnership unless it has elected otherwise. The equity statement and balance sheet need a **capital account for each member** (contributions, distributions, share of income). Confirm the tax treatment with the CPA.
- **W-2 pay.** Members of an LLC taxed as a partnership are generally not treated as employees, so W-2 wages usually mean a change in how the LLC is taxed (for example an S-corp election). That is a tax-structure decision for the CPA, and it changes how pay and distributions appear in the books. The chart of accounts should leave room for both.
- **Cash flow statement** needs each ledger account tagged Operating, Investing, Financing or Cash, set up once with the CPA.
- **Statement files:** most banks offer CSV or OFX/QFX downloads. If a bank offers only PDF statements, tell me, because PDFs cannot be imported reliably.
- **Disclosures** (notes) and the revenue recognition policy come from the CPA.
- **History:** I recommend bringing three years over as monthly trial balances (for comparative statements), plus the project-level history for the projects you enter, rather than every transaction. Full transaction history can follow if the CPA wants it.

## 8. Finding a CPA

A CPA is needed before the Vault can be trusted as the books. Look for one who:

- works with small manufacturers or service firms and with two-member LLCs taxed as partnerships;
- is comfortable with accrual statements and with Excel exports;
- will review a custom system's chart of accounts, revenue recognition policy and first closed month;
- can advise on the W-2 and S-corp question.

Ask for this review as a defined, fixed-scope engagement.

## 9. Still open

1. Sales tax: do you collect and file it?
2. Which basis for the tax return (the books are accrual; the return may differ)?
3. Who the CPA will be.
4. The dual-entry method during the comparison.

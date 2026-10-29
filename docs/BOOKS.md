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
8. **Parallel run through 2027.** QuickBooks stays the official books for 2027. The Vault keeps shadow books beside it. Each month and quarter, compare P&L, balance sheet and A/R line by line. Cut over only when they agree.

## 5. The 2027 parallel year

Decision (Grant): use the Vault's accounting during 2027 alongside QuickBooks.

- **QuickBooks is the official books for 2027.** The 2027 tax return, any lender or customer financials, and the CPA work come from QuickBooks.
- **The Vault keeps shadow books** for the same year and is compared with QuickBooks each month and quarter.
- **Cutover target: January 1, 2028,** a clean fiscal-year boundary. The Vault's opening balances for 2028 come from QuickBooks' closed 2027 year. Cancel QuickBooks only if the 2027 comparisons agree.
- **Opening balances for 2027** come from QuickBooks' closed 2026 year-end (trial balance as of 12/31/2026). That is usually available in January, so the Vault's first real month is January, back-entered once the opening balances are in.

**Double entry burden.** For the year, transactions exist in two systems. Options:

1. **Full dual entry:** strongest test, most work.
2. **Vault-first for sales and project costs** (invoices from milestones, bills, expenses), with the same items keyed or imported into QuickBooks, and bank and card statements imported into both. Recommended: it tests the real workflow without doubling every entry by hand.

Pick one before January.

**Targets** (not promises; they depend on pace):

| When | Goal |
|---|---|
| Nov to Dec 2026 | Foundation, accounts, projects and documents, money tracking (slices 1, 2, 4, 6) |
| Jan 2027 | Chart of accounts, ledger, posting of invoices, bills, expenses (B1, B2); opening balances entered; January transactions entered |
| Feb 2027 | Categorized P&L and balance sheet (B4); close January; compare with QuickBooks |
| Mar 2027 | Bank and card import and reconciliation (B3); first quarter comparison; CPA review |
| Apr to Dec 2027 | Monthly close and comparison; calendar, Gantt and the monday.com cutover built alongside |
| Dec 2027 | Go or no-go for cutover |
| Jan 1, 2028 | Vault becomes the books; QuickBooks cancelled if the year agreed |

Savings from QuickBooks start in 2028. In the meantime, check whether a cheaper QuickBooks plan is enough for a comparison-only year (confirm options with the vendor and with your CPA, since it remains the official record).

## 6. Build order

| Slice | Delivers |
|---|---|
| B1 | Chart of accounts, ledger, journal entries, period locking, trial balance |
| B2 | Invoices, bills, expenses and payments post to the ledger; A/R and A/P aging |
| B3 | Bank and card import, matching, monthly reconciliation |
| B4 | Reports: categorized P&L (income statement), balance sheet, cash flow, P&L by project; accountant and tax exports |
| B5 | The 2027 parallel year: monthly and quarterly comparison, CPA review, then the January 2028 cutover |

B1, B2 and B4 come first because they produce the P&L; B3 follows in the first quarter.

## 7. Questions that decide the details

1. **Who needs GAAP?** A lender, a customer, an investor, an auditor, or is it good practice? This sets how strict the policy must be.
2. **Accrual or cash** for the books, and which for tax?
3. **Entity and tax return:** single-member LLC (Schedule C), partnership, or S-corp? This sets the tax mapping of categories.
4. **Employees or payroll?** Sales tax to collect and file?
5. **Reports wanted:** income statement (P&L) is the same document as the profit and loss statement. Do you also want the balance sheet, cash flow, aging and profit by project?
6. **Bank and card accounts:** how many, and how do customers pay (check, ACH, card)?
7. **A CPA or bookkeeper** who will review the setup and the first closed period?
8. **QuickBooks history:** how many years to bring over, and what cutover date?

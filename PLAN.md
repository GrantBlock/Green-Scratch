# Plan: Concepts Platform

One private workspace (Concepts Vault) for running Block Concepts, plus a thin public side (Concepts Hub). Concept and reasons: `docs/PLATFORM-CONCEPT.md`. Records: `spec/data-model.md`. Branding: `design/system/`.

**Legend:** 🧑 you (Grant) · 🎨 Claude Design · 💻 Claude Code

---

## Phase 0. Decisions

Done:

- [x] Direction: one platform around Opportunities, Projects, Documents, Knowledge and a Claude assistant.
- [x] Numbering: `BC-[TYPE]-YYNNN` (D, W, Q, B, J, L, K) with VOID.
- [x] Stack: Cloudflare D1 + R2 + Vectorize; OneDrive for working files; Onshape for design.
- [x] Customer delivery: expiring links from the app, no customer accounts at first.
- [x] States: Opportunity Open / Won / Lost; Project Design / Build / Install / Closed.
- [x] cGMP: optional documentation package, no in-app signatures.
- [x] Assistant spend cap: $20 per month now, up to $60 later.
- [x] Pilot: enter about 30 opportunities and 6 projects by hand.
- [x] Branding: the design system, dark theme for Hub and Vault.
- [x] Hub header at `/tools`; Tools section added to the live website at release.
- [x] Build this outputs both PDF sheets and a Word document.

Still open:

- [ ] 🧑 The 7th and 8th apps (you listed six).
- [ ] 🧑 Real project folder and required-document list (replaces the starter structure).
- [ ] 🧑 Agent email address and mailbox type.
- [ ] 🧑 Money scope: track project financials only (recommended), or more. See `docs/PLATFORM-CONCEPT.md` section 8.

## Phase 1. Specs (💻)

- [x] `spec/data-model.md` (new).
- [x] `docs/PLATFORM-CONCEPT.md` updated with decisions.
- [ ] Rewrite `spec/system-architecture.md` around the platform (pieces, shells, access model, audit log).
- [ ] Rewrite `spec/concepts-vault-spec.md`: new tabs (Today, Inbox, Pipeline, Projects, Accounts, Knowledge, Library, Registry, Settings), project activation, document control, share links, financial tracking, agent email.
- [ ] New `spec/assistant-spec.md`: tools, permissions, confirmation rule, budget meter, public/Vault separation.
- [ ] Update `spec/concepts-hub-spec.md`: Give this, Ask this and Build this write Leads; Grab this reads public Documents.
- [ ] Update `spec/process-document-builder-spec.md` to the Lead and Document records.
- [ ] 🧑 Review each rewritten spec.

## Phase 2. Design (🎨 + 🧑)

- [ ] 🧑 Add the missing components with `design/GAPS-PROMPT.md`; re-export to `design/system/`.
- [ ] 🧑 Add new screens to the brief: Today, Pipeline board, Opportunity, Project page with checklist and completeness bar, Account, Knowledge list and item, Library, Assistant panel, customer share page. (💻 updates `design/BRIEF.md`.)
- [ ] 🧑 Review and export mockups into `design/`.

## Phase 3. Build (💻), one slice per session

| Slice | Delivers | Done when |
|---|---|---|
| 1 | Tokens, shell, Vault login, D1 schema, Registry | Serials issue and never repeat; dark theme everywhere |
| 2 | Accounts, Leads (Inbox), Opportunities (Pipeline) | You can enter your 30 real opportunities |
| 3 | Projects: activation from a Template, checklist, Jobs, Milestones | You can enter your 6 real projects and see completeness |
| 4 | Documents: R2 upload, revisions, Released lock, OneDrive links, Onshape links | A project holds its PO, invoice, manual, gantt, ROI |
| 5 | Customer share links and upload requests | A customer downloads and uploads without an account |
| 6 | Search and the Vault assistant (with citations, confirm-to-write, spend meter) | You can ask across opportunities, projects and documents |
| 7 | Financial tracking: PO, milestones, invoices, overdue, monthly export | Past-due items appear in Today |
| 8 | Agent email: inbound routing, classification, filing proposals | A forwarded newsletter becomes a Knowledge item |
| 9 | Knowledge: items, trip plans, links | Research is linked to accounts and opportunities |
| 10 | Public Hub: Fix this, Grab this, Give this, Ask this, Build this | Public leads arrive in Inbox |
| 11 | cGMP documentation package Template | A flagged project shows section 07 |
| 12 | Settings, Apply, Cloudflare deploy, cutover from monday.com | You stop using monday.com |

Slices 1 to 6 are the core. Each slice ends with you using it on real data before the next starts.

## Phase 4. Deploy (🧑 + 💻)

- [ ] 🧑 Cloudflare project connected to this repo; push to `main` deploys.
- [ ] 🧑 Create D1, R2 and Vectorize resources; add the Anthropic API key and the Vault password as secrets.
- [ ] 🧑 Set the agent email up (see Phase 0).
- [ ] 💻 Vault stays out of search engines and behind login; customer links expire.
- [ ] 🧑 Add a **Tools** section to the live website when the Hub releases.

## Phase 5. Before relying on it

- [ ] Security pass on login, uploads, share links, email ingestion and the assistant (prompt injection from emails and documents).
- [ ] Backups and an export of all records and files.
- [ ] Accessibility pass on the public Hub.
- [ ] Public Ask this agent tested with adversarial prompts; no Vault data reachable.

## Phase 6. After launch

- [ ] Raise the assistant cap to $60 when it replaces the apps.
- [ ] Decide on invoice PDF generation (level 2) once the pilot shows it is needed.
- [ ] Revisit Develop this when its new detail is supplied.

---

## How to run each session

1. Open this repo in Claude Code. `CLAUDE.md` loads automatically.
2. Say which slice or phase to do.
3. Use the result on real data, then tick the box here and in `spec/BUILD-STATUS.md`.
4. Anything not in Phase 0 comes to you first.

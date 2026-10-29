# Proof of concept: scope, parallel tracks and integration

**Goal.** A working end-to-end proof of concept of the Concepts Vault and Concepts Hub, on real Cloudflare resources, before Books is built. It proves the risky parts (phone and iPad use, the Gantt by touch, document handling with customer links, the assistant over real records) with a small amount of real data.

## 1. The proof, as one story

A person can do all of this on an iPad:

1. A visitor sends an inquiry on **Contact** (Hub). It appears in **Inbox** (Vault).
2. Grant qualifies it. An **Account** and an **Opportunity** (`BC-Q`) exist.
3. He marks it **Won**. A **Project** (`BC-B`) is activated: customer and project folders, a checklist per folder.
4. He uploads documents; a PO, a drawing and a manual go to the right folders and show in the completeness bar.
5. He builds a **Schedule** (Gantt) with categories and dependencies, takes a **baseline**, moves a date with a reason.
6. He plans a **visit** on the **Calendar**, sees it in **Today**.
7. He adds a **milestone** and an **invoice**, and sees it **overdue** in Today when the date passes.
8. He shares a **customer link**; a test customer downloads a released PDF and uploads a requested file.
9. He asks the **Assistant** a question across these records and gets a cited answer.

## 2. In and out

| In the POC | Out (later) |
|---|---|
| Sign-in, nine-tab shell, phone and iPad layouts | Books, ledger, statements, reconciliation |
| Registry numbering (Q, B, J, D) and audit log | Agent email |
| Accounts, Inbox, Pipeline, Opportunity record | Sourcing list and Knowledge base |
| Projects, folders, checklist, documents, revisions | Builder (process document) |
| Schedule with Gantt and baselines | Library (public documents) |
| Calendar and Today | Public Assistant, Hub link on the website |
| Money tracking: milestones, invoices, overdue | cGMP package |
| Customer project page with expiring link | OneDrive sync (a stub link field only) |
| Contact form (Hub) | Claude section editor |
| A thin Vault Assistant (search and cited answers; no actions yet) | |

Builder is a good parallel extra, because it depends only on Foundation and an opportunity, but it is not part of the gate.

**Gate.** The proof is done when Grant has entered at least two real opportunities and one real project and completed the story above on an iPad without help, with no blocking defects. Then Books starts.

## 3. Parallel tracks

Everything runs from the same contracts (section 4). Each track owns its folders; nobody edits another track's folders.

### Design (Claude Design, all open at once)

| Session | Owns | Brief | Can start |
|---|---|---|---|
| **DS** | The design system itself (components, tokens) | `design/GAPS-PROMPT-2.md` | Now |
| **H1** | Hub: home, Contact, Library, Builder, public Assistant, customer project page | `design/sessions/H1-hub.md` | Now (round 1 components cover it) |
| **V1** | Vault shell, Today, Inbox and Pipeline, Opportunity, Accounts | `design/sessions/V1-pipeline.md` | Now, with placeholders for missing components |
| **V2** | Projects, project record, documents checklist, Schedule and Gantt, Share | `design/sessions/V2-projects.md` | Now, with placeholders |
| **V3** | Calendar, Money, Knowledge, Assistant panel, Library/Claude section, Settings | `design/sessions/V3-operations.md` | Now, with placeholders |

Rules that keep parallel design consistent are in `design/sessions/00-shared.md`: only DS creates components; the other sessions compose existing ones and mark anything missing as `NEEDS-DS`, listed in a handoff file. When DS lands, V1 to V3 swap the placeholders.

### Build (Claude Code, separate sessions on separate branches)

| Track | Owns | Needs | Can start |
|---|---|---|---|
| **C0 Contracts** | `packages/contract` (types from `spec/data-model.md`, API routes, fixtures) | Nothing | **Done (first version).** 35 tests pass, including the first nine steps of the story over HTTP |
| **C1 Core** | `apps/vault/server`, database schema, Registry, auth, audit log, storage | C0 | After C0 |
| **C2 Vault UI** | `apps/vault/ui` against a **mock API** built from the fixtures | C0 and design mockups | As mockups land |
| **C3 Hub** | `apps/hub` (home, Contact, customer page) | C0 | After C0 |
| **C4 Assistant** | `apps/vault/assistant` (search, citations) | C1 data | After C1 |
| **Integration** | Replaces mocks with the real API; end-to-end test of the story | All | Last |

Contract-first with mocks is what makes this safe: UI sessions build against fixtures that match the contract, and the real backend is swapped in when ready.

## 4. The contracts (written first, by C0)

1. **Data model:** `spec/data-model.md` is the source for every record and state.
2. **API:** a list of routes per record (list, get, create, update, state change, attach file) in `spec/api-contract.md`, with request and response types in `packages/contract`.
3. **Fixtures:** `packages/contract/fixtures` with a realistic set: about 6 accounts, 8 opportunities, 2 projects with folders, checklist, schedule, invoices and a visit. Used by mocks, tests and design-matching.
4. **Design system:** `design/system/` is imported, never forked.
5. **Hub boundary:** the Hub gets only what the Vault publishes or shares, through a narrow interface; the contract lists exactly which routes the Hub may call.

## 5. Folder ownership

```
apps/vault/ui          C2
apps/vault/server      C1
apps/vault/assistant   C4
apps/hub               C3
packages/contract      C0 (read-only to others; changes go through C0)
packages/ui            wraps design/system; changes only when DS re-exports
design/mockups/<V1|V2|V3|H1>   design sessions
```

A change to a contract goes in `packages/contract` first, as its own small commit, then the dependents update.

## 6. Integration steps

1. C0 has landed; fixtures and the mock API run locally (`cd packages/core && npm run mock`).
2. Design sessions export mockups; DS lands round 2; placeholders are swapped.
3. C2 and C3 build screens against the mock API.
4. C1 lands the real server; each route is switched from mock to real, one record type at a time.
5. C4 reads the real data.
6. Walk the story in section 1 on an iPad. Record every failure in `docs/POC-LOG.md`.
7. Fix, repeat, then the gate.

## 7. What Grant provides, by when

| Needed | For | Blocks |
|---|---|---|
| Cloudflare database, file storage and the two subdomains | C1, C3 | Real deployment of the POC (not the mocks) |
| An Anthropic API key and the $20 cap | C4 | The assistant only |
| Microsoft app registration | OneDrive link | Not in the POC |
| Two real opportunities and one real project, with documents | The gate | The gate |
| One friendly test customer | Customer link test | The gate |
| Running the design sessions with the briefs above | C2, C3 | UI polish; mocks can run without it |

## 8. Risks of going parallel

- **Divergence.** Two design sessions inventing the same component twice. Prevented by the DS-only rule.
- **Contract drift.** UI built to fixtures that no longer match the server. Prevented by changing contracts first and testing both sides against the same fixtures.
- **Merge conflicts.** Prevented by folder ownership and small commits.
- **Integration surprises.** Reduced by switching one record type at a time.

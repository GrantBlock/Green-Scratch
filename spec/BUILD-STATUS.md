# Build status

Slice list and order are in `PLAN.md`, Phase 3 (the platform plan). The list below is the earlier plan and is being replaced.

- [x] Design system supplied in Claude Design and exported to `design/system/`
- [ ] Design system gaps filled (`design/DESIGN-SYSTEM.md`)
- [ ] Mockups exported to `design/`
- [ ] Stack chosen (hosting, framework, Vault backend)
- [ ] Shared tokens and site shell
- [ ] Static pages
- [ ] Grab this
- [ ] Vault shell and Registry
- [ ] Releases and Log List
- [ ] Give this
- [ ] Customers, Update List, Archive, Settings and Apply
- [ ] Build this (Process Document Builder), Preview tier
- [ ] Cloudflare deploy connected

## Proof of concept tracks (`docs/POC.md`)

- [x] C0 Contracts: records, rules, 110 routes, fixtures, mock server, tests (`packages/contract`)
- [x] C1 Core: `packages/core` + `apps/vault` (D1, R2, Registry, audit log, Access sign-in). Verified locally; **not deployed** (needs your Cloudflare setup, `docs/DEPLOY.md`)
- [ ] C2 Vault UI (against the mock)
- [x] C3 Hub: `apps/hub` (home, Contact, Library, customer project page). Verified locally; **not deployed** (`docs/DEPLOY.md`)
- [ ] C4 Assistant
- [ ] Integration and the gate

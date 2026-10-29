# Concepts Hub: Plan to Completion

One page to follow from here to a working app. Inputs: `spec/` (what to build), `reference/` (existing numbering, quoting process, business plan, agent chat). Check items off here as you go; `spec/BUILD-STATUS.md` tracks only the build slices.

**Legend:** 🧑 you (Grant) · 🎨 Claude Design · 💻 Claude Code

---

## Phase 0. Decisions (blocks everything else)

Each has a recommended default. Say "accept defaults" or change any.

| # | Decision | Recommended default | Why it matters |
|---|---|---|---|
| D1 | **Numbering scheme** | Keep `BC-[TYPE]-YYNNN` (spec) and add types from your existing system: `B` build, `L` library, job category codes 03–27, plus a VOID state. Retire the Mora `Q260042` / `QT-26-TFS-0001` formats. | Registry cannot be built until this is fixed. See `reference/README.md`, conflicts 1–4. |
| D2 | **Stack** | Hub: static pages. Vault: small password-protected app on Cloudflare Workers, same host as the website. | Spec leaves it open; Vault needs login, uploads and a backend. |
| D3 | **Vault data store** | Start with files in the repo/Cloudflare storage behind the Vault API; add OneDrive sync (Microsoft Graph or Power Automate) as a later slice. | The spec says OneDrive + Power Automate. That is the riskiest integration, so build it after the app works. |
| D4 | **Agent chat ("Ask this")** | Make it a Hub tool; Pato only at launch; leads land in Log List. | Reuses Log List for lead capture. See handoff §4. |
| D5 | **monday.com / Drive in the quoting process** | Keep out of the Hub and Vault (spec says self-contained). Quote generation stays in the existing Python flow. | Process map assumes monday and Drive MCPs. |
| D6 | **Web Builder** (Process Document Builder) | **Changed:** now in scope. Spec drafted in `spec/process-document-builder-spec.md`. First release is Preview (free) only; paid tiers follow once a payment provider is chosen. | Prototype exists; production needs data model, generated text, saved configs, Vault side. |

- [x] D1 · [x] D2 · [x] D3 · [x] D4 · [x] D5 · [x] D6 (all six recommended defaults accepted)

System map (how everything flows, where you start and end): `docs/system-map.html`.

## Phase 1. Spec cleanup (💻, ~1 session)

Do this before any design or code so everything downstream matches.

- [ ] Fold D1 into `spec/concepts-vault-spec.md` Registry section (types, counters, VOID, client codes on Customers).
- [ ] Review `spec/process-document-builder-spec.md` (new, draft) and answer its **Open** items: tool name, station catalog, payment provider, `BC-W` serial, the theme (now decided by the design system).
- [ ] Add D4's "Ask this" as a tool in `spec/concepts-hub-spec.md` (Website side) and the Vault spec (Log List row shape, Registry type code).
- [ ] Add the stack decision (D2, D3) to `spec/concepts-hub-spec.md` "Hosting & Stack".
- [ ] Update `spec/README.md` to match.
- [ ] Add a `Data model` section per tool (entry fields, log row columns) so code has exact shapes.

## Phase 2. Design (🎨 + 🧑)

- [ ] 🧑 Supply the design system in Claude Design. It must cover everything in `design/DESIGN-SYSTEM.md` (tokens, components, layouts, print/drawing sheets, logo). This is the single branding source for Hub, Vault and every tool.
- [ ] 🧑 Export it into `design/system/`.
- [ ] 🧑 Paste `design/BRIEF.md` (update it after Phase 1 to include "Ask this").
- [ ] 🧑 Review mockups: Hub (Fix this, Grab this, Give this, Develop this, Ask this) and Vault (login, Log List, Releases, Registry, Customers, Settings, Archive), desktop and mobile.
- [ ] 🧑 Export into `design/` and tell Claude Code to read it.
- [ ] 💻 Extract one shared tokens file from the design system (color, type, spacing).

## Phase 3. Build (💻), one slice per session

Order from `CLAUDE.md`. After each slice: run it, review it, tick `spec/BUILD-STATUS.md`, commit.

| Slice | Delivers | Done when |
|---|---|---|
| 1 | Shared tokens, site shell, Fix this layout | Nav works on desktop and phone |
| 2 | Home, Who this, Develop this | Content in, matches mockups |
| 3 | Grab this (public portal) on a sample data file | Four zones, keyboard and screen-reader checks pass |
| 4 | Vault shell: login, tab bar, Registry | Password gate works; serials issue and never repeat |
| 5 | Vault Releases (authoring form) and Log List | New entry gets a serial, appears in Log List and Grab this |
| 6 | Give this wired to Log List | Submission becomes a row with Status and Update List link |
| 7 | Customers, Update List, Archive | Give this matches or creates a Customer |
| 8 | Settings plus Apply (Git publish) | Apply commits and the Hub redeploys |
| 9 | Ask this (agent chat) | Hosted model, rate limits, spend cap, leads in Log List |
| 10 | OneDrive / Power Automate sync (D3) | Vault data and file picker read OneDrive |
| 11 | Build this (Process Document Builder), Preview tier | Stations to document PDF, saved configs, Log List row, Customer match |

## Phase 4. Deploy (🧑 + 💻)

- [ ] 🧑 Create the Cloudflare project and connect it to this repo (push to `main` deploys, as with the website).
- [ ] 🧑 Choose the domain or path (the Hub under the existing site's `/tools`, per spec).
- [ ] 💻 Add environment variables for secrets (Vault password hash, model API key). Never commit them.
- [ ] 💻 Add `robots.txt`, canonical links; keep the Vault out of search (noindex, no sitemap entry).

## Phase 5. Before going live

- [ ] Security pass on the Vault login, uploads and Apply (use the `/security-review` skill).
- [ ] Accessibility pass on Grab this (WCAG 2.1 AA).
- [ ] Agent chat: test against each agent's guardrails with adversarial prompts; strip internal numbering and billing details from the public prompt (handoff §3).
- [ ] Privacy and "AI assistant, not a binding quote" notices (have counsel read them, as with the website legal pages).
- [ ] Load real content: first Grab this entries, real Registry counters starting from your current BC-Q / BC-J numbers.

## Phase 6. After launch

- [ ] Change Management entries start being logged for revisions.
- [ ] Revisit deferred items: paid Build this tiers, deeper Registry integration with quote generation.

---

## How to run each session

1. Open this repo in Claude Code. `CLAUDE.md` loads automatically.
2. Say which slice or phase to do ("Phase 1", "Slice 3").
3. Review what it built; ask for changes; then tick the box here and in `spec/BUILD-STATUS.md`.
4. If a decision comes up that is not in Phase 0, it goes to you first; it does not get picked silently.

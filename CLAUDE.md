# Working agreement for Claude Code

The step-by-step plan is `PLAN.md`. Work from it, and tick items off as they finish.

## Workflow (same as the Block Concepts website)

1. **Spec** (`spec/`) is the source of truth. Change the spec first, then the build. Each spec section is a Main Prompt plus nested Additional Prompts; keep that format.
2. **Design** happens in Claude Design (claude.ai/design) using the Block Concepts design system. Mockups are exported into `design/` and referenced from the spec section they illustrate. `design/BRIEF.md` is the prompt to start from.
3. **Build** happens in Claude Code from the spec plus `design/`. Build one slice at a time (see order below) and tick it off in `spec/BUILD-STATUS.md`.
4. **Deploy**: Cloudflare, on push to `main`. Not connected yet.

## Rules

- Branding has one source: the design system in `design/system/` (read its `README.md` first; see also `design/DESIGN-SYSTEM.md` for gaps). Hub, Vault, every tool and the printed drawing sheets import the same tokens file. Never hard-code a color, font or spacing value, and never copy a prototype's styling. Specs name tokens, not hex values. The design system's copy rules (see `spec/system-architecture.md`, "Design Tokens") apply to every user-facing string.
- Hub and Vault share one data model per tool. The Vault never keeps a shadow copy of what the Hub displays.
- Serials are issued only by Registry (`BC-[TYPE]-YYNNN`). Never hand-assign them in code.
- The Vault is single-user (Grant). No multi-user login.
- Stack: Cloudflare (D1 database, R2 files, Vectorize search), OneDrive for working files, Onshape for design. Do not add other services silently; propose and confirm with Grant first.
- Names: use the plain names in `docs/WORKFLOW.md` section 4. Never use the old "___ this" names in the app or in copy.
- Phone and iPad are first-class: every screen must work and be tested on both.
- Two Cloudflare apps on two addresses: Vault (`vault.blockconceptsllc.com`, Grant only) and Hub (`hub.blockconceptsllc.com`, customers and public). The Hub never binds to the Vault database or private files; it receives only published or shared data through a narrow interface.
- Records are defined only in `spec/data-model.md`. Do not invent a record type in a tool.
- The Vault assistant proposes and Grant confirms; it never sends, files or deletes on its own. The public Ask this agent must never reach Vault data.

## Suggested build order (earlier plan; the current slices are in `PLAN.md`, Phase 3)

1. Shared tokens and site shell (nav, Fix this layout).
2. Static pages: Home, Who this, Develop this.
3. Grab this (public four-zone portal) reading a sample data file.
4. Vault shell: login, tab bar, Registry.
5. Vault Releases (authoring form) and Log List.
6. Give this form wired to Log List.
7. Customers, Update List, Archive, Settings plus Apply (Git publish).

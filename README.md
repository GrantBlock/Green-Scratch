# Concepts Hub

Block Concepts' internal-organization and external document-sharing app, built as two connected pieces:

- **Concepts Hub**: the public site (Home, Who this, Fix this, with Grab this, Give this and Develop this under it).
- **Concepts Vault**: the private, single-user admin app (Log List, Releases, Directory, Customers, Settings, Registry).

The Apply/publish step (Git-based) joins the two.

**Start with [`PLAN.md`](PLAN.md).** It lists the decisions, phases and build slices to follow.

## Where things live

| Path | What it is |
|---|---|
| `spec/` | Source of truth for what to build. Start with `spec/system-architecture.md`. |
| `design/` | The Block Concepts design system (`design/system/`), its gaps and open items (`DESIGN-SYSTEM.md`), mockups and the design brief. |
| `reference/` | Business plan, quoting process map and the existing numbering system and registers. Inputs to the spec; see `reference/README.md` for open conflicts. |
| `CLAUDE.md` | The working agreement for Claude Code in this repo. |

Build, deploy and stack choice are still open (see `CLAUDE.md`).

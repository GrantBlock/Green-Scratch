# Concepts Hub

Block Concepts' internal-organization and external document-sharing app, built as two connected pieces:

- **Concepts Hub**: the public site (Home, Who this, Fix this, with Grab this, Give this and Develop this under it).
- **Concepts Vault**: the private, single-user admin app (Log List, Releases, Directory, Customers, Settings, Registry).

The Apply/publish step (Git-based) joins the two.

## Where things live

| Path | What it is |
|---|---|
| `spec/` | Source of truth for what to build. Start with `spec/system-architecture.md`. |
| `design/` | Claude Design output (design system export, mockups) and the design brief. |
| `CLAUDE.md` | The working agreement for Claude Code in this repo. |

Build, deploy and stack choice are still open (see `CLAUDE.md`).

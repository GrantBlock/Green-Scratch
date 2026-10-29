# Concepts Hub — Spec Package

This package contains the full spec set for Grant's Concepts Hub project: a website document-sharing/lead-gen system paired with a private admin system (Concepts Vault), built as two connected pieces.

## Files in this package

- **system-architecture.md** — Start here. The top-level architecture doc: what the two pieces are (Concepts Hub and Concepts Vault), how "hybrid tools" (Grab this, Give this) are designed to have a presence on both sides, the three shapes a future tool can take (Hybrid / Vault-only / Static page), the shared Design Tokens (colors, visual style), and the "Prompting for Both Sides" pattern to follow when specifying any new tool.

- **concepts-hub-spec.md** — The public-facing Website side. Covers the site shell and navigation (Concepts Hub/Home, Who this/About, Fix this/Tools), and the specs for:
  - **Grab this** — the four-zone document portal (browsing, entry data model, accessibility, Vault integration)
  - **Give this** — the Contact Us / form submission tool (fields, validation, log row structure)
  - **Develop this** — the Process section (Supplying, Guiding, Customizing)

- **concepts-vault-spec.md** — The private, single-user admin side. Covers the six Concepts Vault tabs: Log List, Releases (Release Management + Change Management), Directory, Customers, Settings, and Registry — plus the shared Content Authoring (Hybrid CMS), Unified Admin Log, Update List, and Archive mechanics that tie them together. Also covers storage/backend (OneDrive + Power Automate) and the Git-based Apply/publish step.

## How the pieces fit together

Concepts Hub (public) and Concepts Vault (private) are joined by the Apply/publish step: changes are made in the Vault, Apply pushes them live, and visitors see them on the Hub. Registry (in the Vault) is the single, company-wide numbering source of truth (`BC-[TYPE]-YYNNN`) — not just for this website, but extending to all Block Concepts part numbers.

## Format note

Every section in these docs follows a consistent structure: a **Main Prompt** (the core instruction for that section) followed by **Additional Prompt** subsections for anything nested underneath it (subpages, sub-tabs, sub-features). Edit any file directly and re-upload to Claude to continue refining — that's been the working pattern throughout this project.

## Known open items

As of this package, the spec set has no unresolved open questions — the last round of decisions (Releases split, Registry as company-wide ERP-style numbering, Customers tab, Design Tokens centralization) closed out everything outstanding. Future additions (new tools, deeper Registry integration with existing BC-Q/BC-J tracking, actual framework/hosting choice) aren't blocking issues, just areas not yet started.

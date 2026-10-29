# Claude Design brief: Concepts Hub and Concepts Vault

Use the Block Concepts design system, and nothing else, for all color, type and spacing. Do not invent colors or fonts. If something is missing from the design system (see `design/DESIGN-SYSTEM.md` for the full list it must cover), flag it instead of improvising.
Source specs: `spec/system-architecture.md`, `spec/concepts-hub-spec.md`, `spec/concepts-vault-spec.md`.

Design these screens, desktop and mobile:

**Hub (public)**
1. Fix this landing: 1/5-width button column (Grab this, Give this, Develop this, plus a visually distinct Vault login button) and a 4/5 content area.
2. Grab this: tab bar, item column (1/5), sub-item column (1/5) with labelled search, entry detail (3/5) with first-page preview, title, description, "when to use", download, revision selector (top right) and expand button (top left). Include the empty states and the mobile flow.
3. Give this: contact form with the auto-filled context fields, and the confirmation state.
4. Develop this: Supplying, Guiding (the 4-step rating) and Customizing.

**Vault (private)**
5. Login.
6. Tab bar: Log List, Releases, Directory, Customers, Settings, Registry.
7. Log List: simple row list with Status and Build State filters, Registry serial, inline file preview, Update List reference, archive action.
8. Releases: authoring form (OneDrive file picker, metadata, serial issued on create), plus the Change Management list.
9. Registry: counters per type code and the serial list with manual override.
10. Customers record, Settings with the staged Apply button, Archive list.
11. Build this (Process Document Builder): welcome, two-column station builder with sticky preview, and the two printed sheets (overhead layout, process description). See `spec/process-document-builder-spec.md`.
12. Ask this: agent chat window (Pato), with the "AI assistant, not a binding quote" notice.

Constraint: WCAG 2.1 AA contrast; keyboard operable; the same tokens on Hub, Vault and every tool, with no new colors beyond the design system.

# Shared rules for every design session

Open all sessions at once. Paste this file, then the session's own brief, into each.

1. **Design system:** use `design/system/` only (read `README.md`, `application.md`, `print-drawings.md`). Both apps use the `dark` theme. No new colors, fonts, spacing or components.
2. **Only the DS session creates components.** If you need a component that does not exist, draw a plain labelled placeholder box named `NEEDS-DS: <component name>` and list it in your handoff. Do not style it yourself.
3. **Phone and iPad first.** Design phone (about 400px), iPad portrait, iPad landscape, then desktop. 44px targets, no hover-only controls.
4. **Plain names.** Concepts Vault tabs: Today, Calendar, Pipeline, Projects, Accounts, Money, Knowledge, Library, Settings. Concepts Hub tools: Contact, Builder, Library, Assistant. Never use Grab this, Fix this, Give this, Build this, Ask this, Log List, Releases, Directory or Customers.
5. **States:** every screen shows empty, loading, error and long-text cases.
6. **Data:** use the fields and states in `spec/data-model.md`. Use clearly marked example data; never real customer, supplier or place names.
7. **Copy:** sentence case except where a style is uppercase; no emoji, no exclamation marks, no superlatives.
8. **Export** to `design/mockups/<session id>/` and include a `HANDOFF.md` with: screens, components used, the `NEEDS-DS` list, fields shown per screen, states covered, and open questions.

# Session H1: Concepts Hub

Address: `hub.blockconceptsllc.com`. For customers and the public. Uses the public site's look.

Design:
1. **Hub home:** the tools as a button column (stacked on phone) with the content area.
2. **Contact:** form (name, company, email, phone, message, optional file); only email validated; confirmation state; auto-filled context when arriving from another tool.
3. **Library:** public documents. Tab bar, item list, entry list with a labelled search, detail pane (first-page preview, description, "when to use", download, revision selector, expand control). Phone flow: two-column menu, then full-width detail.
4. **Builder:** welcome screen, two-column station builder with sticky layout preview and proposed operation order, then the two printed sheets. Follow `spec/process-document-builder-spec.md` and the Word process document template.
5. **Assistant (public):** chat with the notice "AI assistant, not a binding quote", streaming state, contact handoff prompt.
6. **Customer project page:** reached by an expiring link. Project name and number, released documents grouped by folder with download buttons, upload slots for requested items, expiry notice. No other navigation.

Data: Lead, Document, Checklist item and Share link in `spec/data-model.md`.
Most components exist already (round 1).

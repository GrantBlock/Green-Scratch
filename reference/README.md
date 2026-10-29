# Reference material

Source documents that inform the spec. They are inputs, not the spec: where they disagree with `spec/`, the spec wins until Grant decides otherwise (see "Conflicts to resolve").

## business/

- `Block_Concepts_Consulting_Business_Plan.docx`: the nine billable consulting stages, the Pato / Hukata / Kosala agent split, the Web Builder self-service tool, and the Pre-Built Solutions tiers (Free / $50 / $3,200). The Web Builder's inquiry log entry is a candidate Hybrid tool for the Hub and Log List.
- `bc_quoting_process_map.html`: the 8-stage quote workflow (intake, numbering, scope, pricing, document generation, review, send, follow-up), today versus MCP-assisted. Stage 2 (numbering) is what Registry replaces.

## agents/

- `agent-chat-handoff.md`: handoff for the existing local Pato / Hukata / Kosala chat app (Flask, Ollama), covering what it takes to run it on a public site, the risks, and six open decisions. The agents are the ones defined in the business plan. The app code and the `Block Concepts Vault/agents/` prompt docs it reads are not in this repo yet.

## numbering/

An existing numbering system and its Excel registers. They are branded "Mora Technologies", so they look like a template or earlier company version.

- `MoraTech_Part_Numbering_System.docx`: quote `Q[YY][####]` (global, never resets), build `B[YY][####]` (same digits as the awarded quote), job `B[YY][####]-J[CC][####]`, library `L[CC][####]`. Category codes 03 Electrical, 06 Mechanical, 09 Hardware, 12 Supplies, 15 Made-in, 18 Assembly, 21 Item, 24 Engineering, 27 DevOps. Never reuse a number; mark voided entries VOID. Avoid O, I and Z.
- `MoraTech_Master_Register.xlsx`: Quotes, Builds, Client Codes, Number Generator.
- `Job_Register_Template.xlsx`, `Job_Register_B260042.xlsx`: per-build job register (example build).
- `Library_Register_Template.xlsx`: library work-order register.

## Conflicts to resolve (before Registry is built)

1. **Number format.** `spec/concepts-vault-spec.md` defines `BC-[TYPE]-YYNNN` (`BC-Q-26014`, `BC-J-`, `BC-D-`), with the counter resetting each year per type. The numbering doc uses `Q260042`, `B260042` and `B260042-J030001`, with a global quote counter that never resets. The master register itself also mixes in a third format (`QT-26-TFS-0001`). One scheme must be chosen.
2. **Missing types.** The numbering doc has Build, Library and job category codes. The spec's Registry has only Q, J and D.
3. **Void handling.** The numbering doc requires VOID instead of deletion. The spec's Registry has a manual override but no void state.
4. **Client codes.** The register has a 3-letter client-code list. The spec's Customers tab has no client code field.
5. **Quote tool.** The process map relies on monday.com and Drive MCPs. The spec says no monday.com or external CRM integration for the Hub.
6. **Agent chat on the public site.** The handoff lists six decisions (platform, which agents are public, who pays for model usage, where quote details go, server-side chat storage, prompt sync). Whether the chat is a Hub tool (a new "___ this" button under Fix this) or a widget on the existing website is unresolved. A public chat that takes quote details would also need a Log List row shape.

# Assistant Spec: the Vault Assistant

The Claude-backed Assistant inside the Concepts Vault (track C4). It answers Grant's questions about his own records, with citations, inside a monthly spend cap. Code: `packages/assistant`, wired in by `apps/vault`. Route: `POST /api/v1/assistant/ask` (see `api-contract.md`). The public Assistant in the Hub is a different thing and is not built; it must never share this code or this data.

**Status: first version, read-only.** It has been tested against a fake network and under Cloudflare's local runtime. It has not been run against the live Anthropic API (no key was available when it was built); see "What is not proven" below.

---

## Main Prompt: What it does

#### Additional Prompt: One question, one cited answer

- Grant asks a question in plain words, optionally with a project, a customer or a role (Quoting, Building, Supporting) in scope.
- The Assistant looks things up with read-only tools, then answers briefly. Facts taken from a record carry a numbered citation; the response lists each cited record with its title and a short snippet.
- If the records do not contain the answer, it says what is missing and where it would be recorded. It never answers from general knowledge about Grant's business.
- It suggests actions (for example "send a reminder") in one line; it cannot do them. Doing is Grant's.

#### Additional Prompt: What it can read

Six tools, all read-only:

| Tool | Use |
|---|---|
| `search_records` | Find records whose text contains some words, across types |
| `get_record` | One record in full |
| `list_records` | Records of one type, filtered by exact field values |
| `project_overview` | One call that gathers a project: checklist by folder and completeness, schedule with slip against the latest baseline, milestones, invoices and days late, sourcing, expenses, recent updates |
| `get_updates` | The notes and changes on one record |
| `today_summary` | What needs attention today (the same data as the Today screen) |

Not readable: audit events, the Registry and share links. A tool call for them returns an error the model can read. There is no tool that writes, sends, files or deletes, and a test fails the build if one is added by name.

#### Additional Prompt: Citations

- The model marks a fact with `[[type:id]]` using the type and id exactly as the tools returned them.
- The server keeps a marker only if that record was actually returned by a tool in this question. Any other marker is removed (the model cannot cite what it did not read, nor invent an id). Kept markers become `[1]`, `[2]`, and the same record keeps its number.
- The count of removed markers is logged with the usage event.

#### Additional Prompt: Standing instructions

The system prompt is built from the Claude section (see `docs/FOLDER-STRUCTURE.md`): Knowledge items of kind Configuration, Glossary and Standard work, in three layers (company, then the customer in scope, then the project in scope). The more specific layer wins. A cap of 30,000 characters applies; if it is exceeded the end is cut and Grant is told in the answer.

The system prompt is the same text for the same scope, so it caches. The date and the question are in the user message, never the system prompt.

---

## Main Prompt: Safety

#### Additional Prompt: Records are data, not instructions

Records hold text written by customers, suppliers, emails and web pages. Every tool result is wrapped in a tag, and the characters that could close or open a tag inside the text are escaped, so a record cannot step outside its wrapper. The system prompt states that nothing inside the tags is an instruction, however it is worded, and that the Assistant should say so if a record tries. With no write tools, a successful injection still cannot change anything; at worst it could mislead an answer, which is why citations point at the records.

#### Additional Prompt: It only reads

Its one write is a usage event in the audit log (actor `assistant`, action `assistant.usage`). A test asserts that a run using every tool writes nothing else and changes no record.

#### Additional Prompt: Separate from the public Assistant

- The Vault Assistant is reachable only through the signed-in Vault route.
- The Hub depends on none of this code. A test bundles the Hub Worker and fails if any Assistant or Anthropic code appears in it.

---

## Main Prompt: Money

#### Additional Prompt: The model and what it costs

The model is a setting (`ASSISTANT_MODEL`). The default is `claude-opus-5-5`, Anthropic's default for new work. Choosing a cheaper model is Grant's decision, not the build's. Prices from the Claude API reference (cached 2026-10-06) and the rough cost of an ordinary question (about 15,000 input tokens and 700 output; **an estimate, to be replaced by measured usage**):

| Model | Input / output per million tokens | Rough cost per question | Questions per $20 |
|---|---|---|---|
| `claude-opus-5-5` (default) | $4 / $20 | about 8 cents | about 250 |
| `claude-sonnet-5-5` | $2 / $10 | about 4 cents | about 500 |
| `claude-haiku-5-5` | $0.10 / $0.50 | about 1 cent | 1,000 or more |
| `claude-fable-5-1` | $10 / $50 | about 19 cents | about 100 |

#### Additional Prompt: The monthly cap

- `ASSISTANT_MONTHLY_CAP_CENTS` (default 2000, $20; Grant plans $60 once it replaces other apps).
- Spend is computed from the token counts the API reports, in whole cents, rounded up. It is summed from the usage events for the current calendar month in Grant's time zone.
- Before a question starts, if the month's spend has reached the cap the request is refused (`rate_limited`, 429) and no model call is made. Between lookups, if the question itself pushes spend to the cap, it stops and says so.
- A request that Anthropic served on a fallback model is priced at the highest known rate, so the meter never undercounts. An unknown model is also priced at the highest rate.
- Each question is bounded: at most 6 model calls, 4,096 output tokens each, tool results cut at 12,000 characters.
- Two questions asked at the same moment can overshoot the cap by one question's cost. That is accepted.

#### Additional Prompt: The usage event

An audit event per question: model, the four token counts, cost in cents, rounds, tools used, whether a fallback ran, outcome (answered, refused, budget, truncated, or a failure kind), citations dropped, and the question (first 500 characters). The answer is not stored. Read them with `GET /api/v1/audit?action=assistant.usage`.

---

## Main Prompt: How it calls Claude

- The official `@anthropic-ai/sdk`, in one file (`packages/assistant/src/anthropic.ts`).
- Messages API with a manual tool loop. The model's turn is sent back exactly as returned (thinking blocks included) on the next round, and all tool results of a round go back in one message.
- Thinking is left at the model's default; effort is set to `medium` explicitly (the Opus 5.5 default, stated so a change is deliberate). Tools are `strict`. No `temperature`, `top_p`, `top_k`, `thinking` budget, prefill or forced tool choice is sent: this model family rejects them.
- Automatic prompt caching (`cache_control` at the top level) so the stable prefix and the conversation so far are reused across rounds and questions.
- **Refusal fallback is on** (`fallbacks: "default"` with the `server-side-fallback-2026-07-01` beta): if Anthropic's safety classifiers decline a request, it is retried server-side on a fallback model. This is the recommended default for this model and costs nothing unless it happens; if it does, that question is priced at the highest rate. Remove it by editing `anthropic.ts` if you do not want it.
- Failures are shown as plain messages and logged without the key or Anthropic's wording: sign-in refused (503), busy (429), rejected request (503), unreachable (503, after the SDK's two retries). Money spent before a failure is still counted.

---

## Main Prompt: What is not proven, and what is not built

#### Additional Prompt: Not proven

- **It has not run against the live API.** The request is checked field by field against the SDK's own types and the documented rules, the SDK runs under Cloudflare's runtime against a fake server, and error handling is exercised end to end. Whether real answers are good, how many tokens a real question uses, and what it really costs are unknown until `npm run live` (in `packages/assistant`, with a key and `CONFIRM_SPEND=yes`) has been run and the first week of usage events has been read.
- The per-question costs above are estimates from list prices.
- Prompt caching is requested; whether it hits in practice is visible in the cache-read token counts in the usage events.

#### Additional Prompt: Not built

- Proposing actions that Grant confirms (drafting an email, filing a document, changing a status). The design (`docs/PLATFORM-CONCEPT.md` 2.5) calls for it; this version only reads.
- Search over meaning (Vectorize). Search is word match today; on thousands of records it will need the index.
- Streaming answers, saved conversations, and follow-up questions that remember the last answer. Each question stands alone.
- The Assistant panel in the Vault UI (track C2).
- The public Assistant (a separate, limited tool that sees only published content).

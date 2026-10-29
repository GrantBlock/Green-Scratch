# @bc/assistant

The Vault Assistant: Claude over the Vault's records. Read-only, cited, with a monthly spend cap. Full description: `spec/assistant-spec.md`.

| File | What |
|---|---|
| `src/assistant.ts` | The question loop, budget, citations, usage log |
| `src/tools.ts` | The six read-only tools; wraps record text so it stays data |
| `src/context.ts` | The system prompt, built from the Claude section (company, customer, project) |
| `src/cost.ts` | Price table and cost in whole cents |
| `src/anthropic.ts` | The only code that calls Anthropic (official SDK) |
| `src/model.ts` | The small interface between the loop and the model |
| `src/testing.ts` | `ScriptedModel`: a stand-in model for tests |
| `scripts/fake-anthropic.ts` | A free stand-in for the API, for local runs |
| `scripts/live-check.ts` | A few real questions against the real model. Spends money; needs `CONFIRM_SPEND=yes` |

```
npm test         # offline: scripted model and a faked network; free
npm run live     # real model; needs ANTHROPIC_API_KEY and CONFIRM_SPEND=yes; a few cents
```

## Rules

1. Read-only. A new tool must not write, and its name must not read like an action. The tests enforce the six names.
2. The Hub never imports this package. A Hub test bundles the Hub and fails if Assistant or Anthropic code appears.
3. Keep the system prompt free of anything that changes per question (date, question, ids), or the cache stops working.
4. When you change the model or the price table, check `src/cost.ts` against the current Claude API price table.
5. Only `src/anthropic.ts` knows about the SDK. Everything else is tested without a network.

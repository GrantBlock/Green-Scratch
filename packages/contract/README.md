# @bc/contract

Records, states, rules, API routes and fixtures for the Concepts Vault and Concepts Hub. Every other package builds on this one. The prose version of the data is `spec/data-model.md`; the prose version of the routes is `spec/api-contract.md`.

## Use it

```
cd packages/contract
npm install
npm test            # schemas, rules, links and fixtures
npm run typecheck
npm run docs        # regenerate the routes table in spec/api-contract.md
npm run fixtures:json
```

Node 22.18 or later runs the TypeScript files directly; there is no build step.

## What is here

| Path | What |
|---|---|
| `src/common.ts` | Ids, dates, money (integer cents), Registry numbers, the folder structure |
| `src/states.ts` | Every state set and its allowed transitions |
| `src/records.ts` | One schema per record type (zod); the types come from them |
| `src/rules.ts`, `src/derive.ts` | Rules between fields; computed values (overdue, completeness, Today) |
| `src/dataset.ts`, `src/refs.ts` | Check a whole dataset: links resolve, numbers unique, share links safe |
| `src/api.ts`, `src/hub.ts` | Routes, request and response shapes, and the narrow Hub-to-Vault interface |
| `fixtures/data.ts` | Fictional example data, type-checked; "today" is 2026-10-29 |
| `test/` | Contract tests |

The mock server and the end-to-end story tests live in `packages/core` (`npm run mock` there), because they run the real business logic.

## Rules for changing it

1. Change the contract and `spec/data-model.md` together, in one small commit, before anything that depends on it.
2. Keep `fixtures/data.ts` valid: `npm test` fails if it is not.
3. Never add a record type in a tool. Add it here.
4. Server-set fields (`id`, `version`, `createdAt`, `updatedAt`, `number`, `type`) are never accepted from a client.

## Owner

Track C0 (`docs/POC.md`). Other tracks read from this package and do not edit it.

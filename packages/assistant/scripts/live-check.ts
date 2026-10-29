/**
 * Runs a few real questions against the real model, over the fixture data, and checks the answers' structure. This SPENDS REAL MONEY
 * (a few cents), so it will not run unless you ask for it:
 *
 *   ANTHROPIC_API_KEY=sk-ant-... CONFIRM_SPEND=yes node scripts/live-check.ts
 *
 * It checks things the offline tests cannot: that the API accepts the request, that the tool loop works with the real model, that
 * citations point at records that were read, and what a question really costs. It cannot judge whether an answer is good; read them.
 */
import { fixtures, FIXTURE_NOW, FIXTURE_TODAY } from '@bc/contract/fixtures';
import { MemoryStore } from '@bc/core';
import { createAnthropicModel, createAssistant, DEFAULT_MODEL, dollars } from '../src/index.ts';

const key = process.env.ANTHROPIC_API_KEY;
if (!key) { console.error('Set ANTHROPIC_API_KEY.'); process.exit(2); }
if (process.env.CONFIRM_SPEND !== 'yes') { console.error('This spends real money (about 10 to 40 cents on Opus 5.5). Set CONFIRM_SPEND=yes to go ahead.'); process.exit(2); }

const modelId = process.env.ASSISTANT_MODEL ?? DEFAULT_MODEL;
const CAP = 100; // $1.00 hard stop for this whole check
const store = new MemoryStore(fixtures as unknown as Record<string, any[]>);
const assistant = createAssistant({ model: createAnthropicModel({ apiKey: key }), modelId, monthlyCapCents: CAP });

const questions: { q: string; extra?: Record<string, unknown>; expect: (a: Awaited<ReturnType<typeof assistant.ask>>) => string[] }[] = [
  { q: 'Which invoices are overdue, and by how many days?', expect: (a) => [/19/.test(a.answer) ? '' : 'expected the 19 days late', a.citations.some((c) => c.recordId === 'inv-2') ? '' : 'expected a citation to inv-2'] },
  { q: 'How is the cap torque project doing? Is anything late against the contract schedule?', extra: { projectId: 'proj-1', role: 'Building' }, expect: (a) => [/14|two weeks|fabrication/i.test(a.answer) ? '' : 'expected the 14-day fabrication slip', a.citations.length ? '' : 'expected citations'] },
  { q: 'What documents are still missing on the inspection cell, and which are for the cGMP package?', extra: { projectId: 'proj-2' }, expect: (a) => [/material|cleanab/i.test(a.answer) ? '' : 'expected the cGMP package items'] },
];

let failures = 0;
for (const { q, extra, expect } of questions) {
  const t0 = Date.now();
  const a = await assistant.ask({ question: q, ...extra } as never, { store, now: FIXTURE_NOW, today: FIXTURE_TODAY });
  const problems = [...expect(a), /\[\[/.test(a.answer) ? 'raw citation marker left in the answer' : ''].filter(Boolean);
  console.log(`\nQ: ${q}\n${a.answer}\n  citations: ${a.citations.map((c) => `${c.recordType}:${c.recordId}`).join(', ') || 'none'}\n  tokens in/out: ${a.usage.inputTokens}/${a.usage.outputTokens}, cost ${dollars(a.usage.costCents)} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  if (problems.length) { failures += problems.length; console.log(`  CHECK: ${problems.join('; ')}`); }
}
console.log('\nDone. Read the answers above: the checks only catch structure, not quality.');
process.exit(failures ? 1 : 0);

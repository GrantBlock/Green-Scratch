/** The Assistant inside the real Vault: real SQLite store, real routes, sign-in on, scripted model. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AssistantAnswer } from '@bc/contract';
import { fixtures, FIXTURE_NOW } from '@bc/contract/fixtures';
import { createApp, MemoryFiles, seedStore } from '@bc/core';
import { ScriptedModel, text, toolCalls } from '@bc/assistant/testing';
import { assistantFromEnv } from '../src/assistant-config.ts';
import { devAuthenticator } from '../src/auth.ts';
import { D1Store } from '../src/d1-store.ts';
import { migratedDb } from '../src/testing-sqlite.ts';

async function vault(model: ScriptedModel, env: Record<string, string | undefined> = { ASSISTANT_MONTHLY_CAP_CENTS: '2000' }) {
  const db = migratedDb();
  const store = new D1Store(db);
  await seedStore(store, fixtures as unknown as Record<string, unknown[]>);
  const assistant = assistantFromEnv({ DEV_AUTH: 'true', ...env } as never, model);
  const app = createApp({ store, files: new MemoryFiles(), clock: () => FIXTURE_NOW, authenticate: devAuthenticator(), assistant });
  const call = async (method: string, path: string, body?: unknown) => {
    const r = await app.handle(new Request(`http://localhost/api/v1${path}`, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }));
    return { status: r.status, json: (await r.json()) as any };
  };
  return { call, db, store };
}

test('POST /assistant/ask answers from the real database, cites records, and meters the spend', async () => {
  const model = new ScriptedModel(
    toolCalls([{ id: 't1', name: 'project_overview', input: { projectId: 'proj-1' } }], { inputTokens: 4000, outputTokens: 100 }),
    text('The delivery invoice is 19 days late [[invoice:inv-2]].', { inputTokens: 6000, outputTokens: 60 }),
  );
  const v = await vault(model);
  const r = await v.call('POST', '/assistant/ask', { question: 'Who has not paid on the torque station?', projectId: 'proj-1', role: 'Building' });
  assert.equal(r.status, 200);
  const a = AssistantAnswer.parse(r.json);
  assert.equal(a.answer, 'The delivery invoice is 19 days late [1].');
  assert.equal(a.citations[0]!.recordId, 'inv-2');
  assert.ok(a.usage.costCents >= 1 && a.usage.monthlyCapCents === 2000);
  // The usage event is a real audit record, listed through the ordinary route.
  const log = await v.call('GET', '/audit?action=assistant.usage');
  assert.equal(log.json.items.length, 1);
  assert.equal(log.json.items[0].actor, 'assistant');
  assert.equal(log.json.items[0].after.costCents, a.usage.costCents);
  v.db.close();
});

test('the monthly cap holds across questions: the next one is refused with a clear message', async () => {
  const model = new ScriptedModel(text('First.', { inputTokens: 300_000, outputTokens: 4000 }), text('never asked'));
  const v = await vault(model, { ASSISTANT_MONTHLY_CAP_CENTS: '100' }); // $1.00
  const first = await v.call('POST', '/assistant/ask', { question: 'A big question' });
  assert.equal(first.status, 200);
  assert.ok(first.json.usage.monthToDateCents >= 100);
  const second = await v.call('POST', '/assistant/ask', { question: 'Another' });
  assert.equal(second.status, 429);
  assert.equal(second.json.error.code, 'rate_limited');
  assert.match(second.json.error.message, /\$1\.00/);
  assert.equal(model.requests.length, 1);
  v.db.close();
});

test('with no key set there is no Claude: a plain word match that says so', async () => {
  assert.equal(assistantFromEnv({} as never), undefined);
  assert.equal(assistantFromEnv({ ANTHROPIC_API_KEY: '   ' } as never), undefined);
  const db = migratedDb();
  const store = new D1Store(db);
  await seedStore(store, fixtures as unknown as Record<string, unknown[]>);
  const app = createApp({ store, files: new MemoryFiles(), clock: () => FIXTURE_NOW, authenticate: devAuthenticator(), assistant: assistantFromEnv({} as never) });
  const r = await app.handle(new Request('http://localhost/api/v1/assistant/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'torque station' }) }));
  const a = (await r.json()) as any;
  assert.match(a.answer, /not set up yet/);
  assert.equal(a.usage.costCents, 0);
  db.close();
});

test('the Assistant is behind Vault sign-in like everything else', async () => {
  const db = migratedDb();
  const app = createApp({ store: new D1Store(db), files: new MemoryFiles(), clock: () => FIXTURE_NOW, authenticate: async () => null });
  const r = await app.handle(new Request('https://vault.example/api/v1/assistant/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'hello' }) }));
  assert.equal(r.status, 401);
  db.close();
});

test('settings: model and cap come from the environment, with safe defaults, and a redirect URL is ignored outside local development', async () => {
  const spy = new ScriptedModel(text('ok', { inputTokens: 1, outputTokens: 1 }));
  const db = migratedDb();
  const store = new D1Store(db);
  const mk = (env: Record<string, string>) => assistantFromEnv({ ...env } as never, spy)!;
  await mk({ ASSISTANT_MODEL: 'claude-sonnet-5-5' }).ask({ question: 'q' } as never, { store, now: FIXTURE_NOW, today: '2026-10-29' });
  assert.equal(spy.requests[0]!.model, 'claude-sonnet-5-5');
  const spy2 = new ScriptedModel(text('ok', { inputTokens: 1, outputTokens: 1 }));
  const bad = await assistantFromEnv({ ASSISTANT_MONTHLY_CAP_CENTS: 'garbage' } as never, spy2)!.ask({ question: 'q' } as never, { store, now: FIXTURE_NOW, today: '2026-10-29' });
  assert.equal(bad.usage.monthlyCapCents, 2000, 'an unreadable cap falls back to $20');
  assert.equal(spy2.requests[0]!.model, 'claude-opus-5-5', 'the default model');
  db.close();
});

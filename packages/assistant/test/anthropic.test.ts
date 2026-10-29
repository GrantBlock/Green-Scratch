/** The real Anthropic SDK against a fake network: checks exactly what would be sent, and how every kind of failure is reported. */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { AssistantUnavailableError, createAnthropicModel, TOOLS } from '../src/index.ts';

interface Captured { url: string; headers: Headers; body: any }
function fakeNetwork(respond: (n: number, c: Captured) => Response) {
  const seen: Captured[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const c = { url: String(input), headers: new Headers(init?.headers), body: init?.body ? JSON.parse(String(init.body)) : undefined };
    seen.push(c);
    return respond(seen.length, c);
  }) as typeof fetch;
  return { seen, fetchImpl };
}
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const message = (over: Record<string, unknown> = {}) => ({
  id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-opus-5-5', stop_sequence: null, stop_reason: 'end_turn',
  content: [{ type: 'text', text: 'Hello' }],
  usage: { input_tokens: 100, output_tokens: 20, cache_creation_input_tokens: 5, cache_read_input_tokens: 7 }, ...over,
});
const REQ = { model: 'claude-opus-5-5', system: 'SYSTEM TEXT', messages: [{ role: 'user' as const, content: 'Question?' }], tools: TOOLS, maxTokens: 4096 };

test('the request has the shape the API wants for Opus 5.5, and nothing it rejects', async () => {
  const net = fakeNetwork(() => json(200, message()));
  const model = createAnthropicModel({ apiKey: 'sk-ant-test-key', baseUrl: 'https://api.test', fetch: net.fetchImpl, maxRetries: 0 });
  await model.create(REQ);
  const { url, headers, body } = net.seen[0]!;
  assert.match(url, /^https:\/\/api\.test\/v1\/messages(\?beta=true)?$/);
  assert.ok(headers.get('x-api-key') === 'sk-ant-test-key' || headers.get('authorization') === 'Bearer sk-ant-test-key', 'the key is sent as the SDK sends it');
  assert.ok(headers.get('anthropic-version'));
  assert.ok((headers.get('anthropic-beta') ?? '').split(',').includes('server-side-fallback-2026-07-01'), 'refusal fallback is on');

  assert.equal(body.model, 'claude-opus-5-5');
  assert.equal(body.max_tokens, 4096);
  assert.equal(body.fallbacks, 'default');
  assert.deepEqual(body.cache_control, { type: 'ephemeral' });
  assert.deepEqual(body.output_config, { effort: 'medium' });
  assert.deepEqual(body.tool_choice, { type: 'auto' });
  assert.equal(body.system, 'SYSTEM TEXT');
  assert.deepEqual(body.messages, [{ role: 'user', content: 'Question?' }]);
  // Things this model family rejects with a 400 must never be sent.
  for (const banned of ['temperature', 'top_p', 'top_k', 'thinking', 'budget_tokens']) assert.ok(!(banned in body) && !JSON.stringify(body).includes(`"${banned}"`), `must not send ${banned}`);
  // Strict tools, each with a closed schema.
  assert.equal(body.tools.length, TOOLS.length);
  for (const t of body.tools) { assert.equal(t.strict, true, t.name); assert.equal(t.input_schema.additionalProperties, false, t.name); }
  // No prefilled assistant turn.
  assert.notEqual(body.messages.at(-1).role, 'assistant');
});

test('on the last round the model is told not to use tools', async () => {
  const net = fakeNetwork(() => json(200, message()));
  await createAnthropicModel({ apiKey: 'k', baseUrl: 'https://api.test', fetch: net.fetchImpl, maxRetries: 0 }).create({ ...REQ, toolChoice: 'none' });
  assert.deepEqual(net.seen[0]!.body.tool_choice, { type: 'none' });
  assert.equal(net.seen[0]!.body.tools.length, TOOLS.length, 'definitions are still sent');
});

test('the reply is read faithfully: text, tool calls, thinking blocks, and all four token counts', async () => {
  const content = [{ type: 'thinking', thinking: '', signature: 'sig-1' }, { type: 'tool_use', id: 'toolu_1', name: 'get_record', input: { type: 'project', id: 'proj-1' } }];
  const net = fakeNetwork(() => json(200, message({ content, stop_reason: 'tool_use' })));
  const r = await createAnthropicModel({ apiKey: 'k', baseUrl: 'https://api.test', fetch: net.fetchImpl, maxRetries: 0 }).create(REQ);
  assert.equal(r.stopReason, 'tool_use');
  assert.deepEqual(r.content, content, 'blocks come back untouched, so they can be sent back unchanged');
  assert.deepEqual(r.usage, { inputTokens: 100, outputTokens: 20, cacheCreationTokens: 5, cacheReadTokens: 7 });
  assert.equal(r.fallbackRan, false);
});

test('a reply with missing cache counts is read as zero, and a fallback is noticed', async () => {
  const bare = fakeNetwork(() => json(200, message({ usage: { input_tokens: 10, output_tokens: 2 } })));
  const a = await createAnthropicModel({ apiKey: 'k', baseUrl: 'https://api.test', fetch: bare.fetchImpl, maxRetries: 0 }).create(REQ);
  assert.deepEqual(a.usage, { inputTokens: 10, outputTokens: 2, cacheCreationTokens: 0, cacheReadTokens: 0 });

  const viaIterations = fakeNetwork(() => json(200, message({ usage: { input_tokens: 10, output_tokens: 2, iterations: [{ type: 'message', input_tokens: 5, output_tokens: 0 }, { type: 'fallback_message', input_tokens: 5, output_tokens: 2 }] } })));
  assert.equal((await createAnthropicModel({ apiKey: 'k', baseUrl: 'https://api.test', fetch: viaIterations.fetchImpl, maxRetries: 0 }).create(REQ)).fallbackRan, true);
  const viaBlock = fakeNetwork(() => json(200, message({ content: [{ type: 'fallback', from: { model: 'a' }, to: { model: 'b' } }, { type: 'text', text: 'ok' }] })));
  assert.equal((await createAnthropicModel({ apiKey: 'k', baseUrl: 'https://api.test', fetch: viaBlock.fetchImpl, maxRetries: 0 }).create(REQ)).fallbackRan, true);
});

test('each kind of failure becomes a message Grant can act on, with no key or detail in it', async () => {
  const err = (type: string, message: string) => ({ type: 'error', error: { type, message } });
  const cases: [number, string, AssistantUnavailableError['kind']][] = [
    [401, 'authentication_error', 'not_configured'], [403, 'permission_error', 'not_configured'], [429, 'rate_limit_error', 'busy'],
    [400, 'invalid_request_error', 'rejected'], [404, 'not_found_error', 'rejected'], [500, 'api_error', 'unreachable'], [529, 'overloaded_error', 'unreachable'],
  ];
  const quiet = mock.method(console, 'error', () => {});
  try {
    for (const [status, type, kind] of cases) {
      const net = fakeNetwork(() => json(status, err(type, 'SECRET-DETAIL sk-ant-leak')));
      await assert.rejects(
        createAnthropicModel({ apiKey: 'k', baseUrl: 'https://api.test', fetch: net.fetchImpl, maxRetries: 0 }).create(REQ),
        (e: any) => e instanceof AssistantUnavailableError && e.kind === kind && !/SECRET-DETAIL|sk-ant/.test(e.message),
        `${status} ${type}`,
      );
    }
    const dropped = (async () => { throw new TypeError('fetch failed'); }) as unknown as typeof fetch;
    await assert.rejects(createAnthropicModel({ apiKey: 'k', baseUrl: 'https://api.test', fetch: dropped, maxRetries: 0 }).create(REQ), (e: any) => e instanceof AssistantUnavailableError && e.kind === 'unreachable', 'connection dropped');
  } finally { quiet.mock.restore(); }
});

test('a temporary server error is retried by the SDK before giving up', async () => {
  const net = fakeNetwork((n) => (n === 1 ? json(529, { type: 'error', error: { type: 'overloaded_error', message: 'busy' } }) : json(200, message())));
  const r = await createAnthropicModel({ apiKey: 'k', baseUrl: 'https://api.test', fetch: net.fetchImpl, maxRetries: 1 }).create(REQ);
  assert.equal(net.seen.length, 2);
  assert.equal(r.stopReason, 'end_turn');
});

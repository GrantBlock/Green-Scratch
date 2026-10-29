/**
 * A stand-in for api.anthropic.com for local development and tests that need a real network hop. It makes one lookup (today_summary)
 * and then answers with a citation to whatever invoice that lookup returned. It costs nothing and proves nothing about answer quality.
 * Run: node scripts/fake-anthropic.ts [port]   Then run the Vault with ANTHROPIC_BASE_URL=http://localhost:<port> and DEV_AUTH=true.
 * Every request it receives is appended, as one JSON line, to the file named by LOG (default /tmp/fake-anthropic.log).
 */
import http from 'node:http';
import { appendFileSync } from 'node:fs';

const port = Number(process.argv[2] ?? 9911);
const LOG = process.env.LOG ?? '/tmp/fake-anthropic.log';

http.createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    appendFileSync(LOG, JSON.stringify({ method: req.method, url: req.url, headers: req.headers, body }) + '\n');
    const reply = (status: number, payload: unknown) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(payload)); };
    if (req.method !== 'POST' || !req.url?.startsWith('/v1/messages')) return reply(404, { type: 'error', error: { type: 'not_found_error', message: 'no such route' } });

    // Ask for a failure by putting FAIL401, FAIL429, FAIL400, FAIL500 or REFUSE in the question.
    const asked = JSON.stringify(body.messages?.[0]?.content ?? '');
    const status = /FAIL(\d{3})/.exec(asked)?.[1];
    if (status) return reply(Number(status), { type: 'error', error: { type: ({ 401: 'authentication_error', 429: 'rate_limit_error', 400: 'invalid_request_error', 500: 'api_error' } as Record<string, string>)[status] ?? 'api_error', message: `fake ${status} SECRET-DETAIL` } });
    if (asked.includes('REFUSE')) return reply(200, { id: 'msg_fake', type: 'message', role: 'assistant', model: body.model, stop_sequence: null, stop_reason: 'refusal', stop_details: { type: 'refusal', category: null, explanation: 'fake' }, content: [], usage: { input_tokens: 300, output_tokens: 0 } });
    const last = body.messages?.at(-1);
    const result = Array.isArray(last?.content) ? last.content.find((b: any) => b.type === 'tool_result') : undefined;
    const base = { id: 'msg_fake', type: 'message', role: 'assistant', model: body.model, stop_sequence: null };
    if (!result) {
      return reply(200, { ...base, stop_reason: 'tool_use', content: [{ type: 'thinking', thinking: '', signature: 'fake-signature' }, { type: 'tool_use', id: 'toolu_fake_1', name: 'today_summary', input: {} }], usage: { input_tokens: 1500, output_tokens: 40, cache_creation_input_tokens: 1200, cache_read_input_tokens: 0 } });
    }
    const m = /"type":"invoice","id":"([^"]+)"/.exec(String(result.content));
    const text = m ? `One invoice is overdue [[invoice:${m[1]}]]. This answer came from the fake model.` : 'Nothing is overdue. This answer came from the fake model.';
    reply(200, { ...base, stop_reason: 'end_turn', content: [{ type: 'text', text }], usage: { input_tokens: 600, output_tokens: 55, cache_creation_input_tokens: 0, cache_read_input_tokens: 1200 } });
  });
}).listen(port, () => console.log(`Fake Anthropic API on http://localhost:${port} (log: ${LOG})`));

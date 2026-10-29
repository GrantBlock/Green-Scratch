import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { fixtures, FIXTURE_NOW } from '@bc/contract/fixtures';
import { createApp, createHubHandler, MemoryFiles, seedStore } from '@bc/core';
import { combine, listen } from '@bc/core/testing';
import { accessAuthenticator, devAuthenticator } from '../src/auth.ts';
import { D1Store } from '../src/d1-store.ts';
import { migratedDb } from '../src/testing-sqlite.ts';

// ---- A fake Cloudflare Access: our own key pair and key list -------------------------------------------------------------
const TEAM = 'example.cloudflareaccess.com';
const AUD = 'aud-123';
const EMAIL = 'grant@example.com';
const NOW_S = Math.floor(Date.parse(FIXTURE_NOW) / 1000);
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
const b64 = (o: unknown) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');

function token(claims: Record<string, unknown> = {}, opts: { key?: typeof privateKey; alg?: string; kid?: string } = {}) {
  const header = { alg: opts.alg ?? 'RS256', kid: opts.kid ?? 'k1', typ: 'JWT' };
  const payload = { aud: [AUD], iss: `https://${TEAM}`, email: EMAIL, exp: NOW_S + 3600, nbf: NOW_S - 10, ...claims };
  const data = `${b64(header)}.${b64(payload)}`;
  const sig = createSign('RSA-SHA256').update(data).sign(opts.key ?? privateKey).toString('base64url');
  return `${data}.${sig}`;
}

let url: string;
let closeServer: () => Promise<void>;
let db: ReturnType<typeof migratedDb>;

before(async () => {
  db = migratedDb();
  const store = new D1Store(db);
  await seedStore(store, fixtures as unknown as Record<string, unknown[]>);
  const authenticate = accessAuthenticator({ teamDomain: TEAM, audience: AUD, allowedEmail: EMAIL, fetchKeys: async () => ({ keys: [jwk] }), nowSeconds: () => NOW_S });
  const app = createApp({ store, files: new MemoryFiles(), clock: () => FIXTURE_NOW, authenticate });
  const s = await listen(combine(app.handle, createHubHandler(app.publicApi)));
  url = s.url; closeServer = s.close;
});
after(async () => { await closeServer(); db.close(); });

const get = (path: string, headers: Record<string, string> = {}) => fetch(url + path, { headers });
const as = (t: string) => ({ 'cf-access-jwt-assertion': t });

test('the health check is open; everything else needs sign-in', async () => {
  assert.equal((await get('/api/v1/health')).status, 200);
  for (const path of ['/api/v1/today', '/api/v1/accounts', '/api/v1/documents/doc-po-1/file', '/api/v1/leads']) {
    const r = await get(path);
    assert.equal(r.status, 401, path);
    assert.equal(((await r.json()) as { error: { code: string } }).error.code, 'unauthorized');
  }
});

test('a valid Access token for the allowed email gets in', async () => {
  assert.equal((await get('/api/v1/accounts', as(token()))).status, 200);
  assert.equal((await get('/api/v1/accounts', { cookie: `CF_Authorization=${token()}` })).status, 200);
});

test('bad tokens are refused', async () => {
  const cases: [string, string][] = [
    ['wrong audience', token({ aud: ['someone-else'] })],
    ['wrong issuer', token({ iss: 'https://evil.cloudflareaccess.com' })],
    ['expired', token({ exp: NOW_S - 1 })],
    ['not yet valid', token({ nbf: NOW_S + 3600 })],
    ['another person', token({ email: 'intruder@example.com' })],
    ['no email', token({ email: undefined })],
    ['signed by another key', token({}, { key: other.privateKey })],
    ['unknown key id', token({}, { kid: 'nope' })],
    ['algorithm none', `${b64({ alg: 'none', kid: 'k1' })}.${b64({ aud: [AUD], iss: `https://${TEAM}`, email: EMAIL, exp: NOW_S + 3600 })}.`],
    ['HS256 downgrade', token({}, { alg: 'HS256' })],
    ['garbage', 'not.a.jwt'],
    ['tampered payload', (() => { const [h, , s] = token().split('.'); return `${h}.${b64({ aud: [AUD], iss: `https://${TEAM}`, email: 'intruder@example.com', exp: NOW_S + 3600 })}.${s}`; })()],
  ];
  for (const [name, t] of cases) assert.equal((await get('/api/v1/accounts', as(t))).status, 401, name);
});

test('the email check ignores case', async () => {
  assert.equal((await get('/api/v1/accounts', as(token({ email: EMAIL.toUpperCase() })))).status, 200);
});

test('the Hub routes need no Vault sign-in, and give no access to the Vault', async () => {
  assert.equal((await get('/hub/api/library')).status, 200);
  assert.equal((await get('/hub/api/v1/accounts')).status, 404);
  assert.equal((await get('/hub/api/v1/today', as(token()))).status, 404, 'even a signed-in request cannot reach Vault routes through /hub');
});

test('SQL in a filter or search is treated as text', async () => {
  const h = as(token());
  const attempts = [
    "/api/v1/accounts?name') OR 1=1 --=x",
    "/api/v1/accounts?name=x' OR '1'='1",
    "/api/v1/accounts?q=' OR 1=1 --",
    '/api/v1/accounts?q=%25',
    '/api/v1/accounts?q=_',
    "/api/v1/accounts?kind=Customer'; DROP TABLE records; --",
    '/api/v1/accounts?$.x=1',
    '/api/v1/search?q=%27%29%20OR%201%3D1',
  ];
  for (const path of attempts) {
    const r = await get(path, h);
    assert.ok(r.status === 200, `${path} -> ${r.status}`);
    const body = (await r.json()) as { items?: unknown[]; hits?: unknown[] };
    const n = (body.items ?? body.hits ?? []).length;
    assert.equal(n, 0, `${path} matched ${n} records`);
  }
  const all = (await (await get('/api/v1/accounts', h)).json()) as { items: unknown[] };
  assert.equal(all.items.length, fixtures.account.length, 'the table is intact');
});

test('responses are not cached and bodies are JSON', async () => {
  const r = await get('/api/v1/accounts', as(token()));
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.match(r.headers.get('content-type') ?? '', /json/);
});

test('local development sign-in works only for localhost', async () => {
  const dev = devAuthenticator();
  assert.ok(await dev(new Request('http://localhost:8787/api/v1/today')));
  assert.ok(await dev(new Request('http://127.0.0.1:8787/api/v1/today')));
  assert.equal(await dev(new Request('https://vault.blockconceptsllc.com/api/v1/today')), null);
  assert.equal(await dev(new Request('https://evil.com/api/v1/today')), null);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHub } from '../src/worker.ts';
import { assetsFromDisk, makeVault, overRpc } from './helpers.ts';

const BASE = 'https://hub.test';
async function setup(extra = {}) {
  const v = await makeVault();
  return { ...v, hub: createHub({ vault: v.app.publicApi, assets: assetsFromDisk, ...extra }) };
}
const get = (hub: (r: Request) => Promise<Response>, path: string, method = 'GET') => hub(new Request(BASE + path, { method }));
const post = (hub: (r: Request) => Promise<Response>, path: string, body: unknown, headers: Record<string, string> = {}) =>
  hub(new Request(BASE + path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }));
const leads = async (s: Awaited<ReturnType<typeof setup>>) => (await s.store.list('lead')).length;

test('every response carries the security headers', async () => {
  const { hub } = await setup();
  for (const path of ['/', '/contact', '/library', '/p/tok_abcdefghijklmnop', '/assets/hub/home.js', '/hub/api/library', '/nope']) {
    const r = await get(hub, path);
    assert.ok(r.headers.get('content-security-policy')?.includes("default-src 'none'"), path);
    assert.ok(r.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"), path);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff', path);
    assert.equal(r.headers.get('x-frame-options'), 'DENY', path);
    assert.equal(r.headers.get('referrer-policy'), 'no-referrer', path);
  }
});

test('script source is the Hub itself only: no inline script, no third party, no eval', async () => {
  const { hub } = await setup();
  const csp = (await get(hub, '/')).headers.get('content-security-policy')!;
  assert.match(csp, /script-src 'self'(;|$)/);
  assert.ok(!csp.includes('unsafe-eval'));
  const html = await (await get(hub, '/')).text();
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(html.replace(/<noscript>[\s\S]*?<\/noscript>/g, '')), 'no inline <script>');
});

test('pages are not indexed until the Hub is released', async () => {
  const { hub } = await setup();
  const r = await get(hub, '/');
  assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.match(await r.text(), /name="robots" content="noindex, nofollow"/);
  assert.equal(await (await get(hub, '/robots.txt')).text(), 'User-agent: *\nDisallow: /\n');
  const open = await setup({ indexable: true });
  assert.equal((await get(open.hub, '/')).headers.get('x-robots-tag'), null);
  assert.equal((await get(open.hub, '/p/tok_abcdefghijklmnop')).headers.get('x-robots-tag'), 'noindex, nofollow', 'customer pages are never indexed');
});

test('customer pages and data are never cached', async () => {
  const { hub } = await setup();
  for (const path of ['/p/tok_abcdefghijklmnop', '/hub/p/tok_abcdefghijklmnop', '/hub/api/library']) assert.equal((await get(hub, path)).headers.get('cache-control'), 'no-store', path);
  assert.match((await get(hub, '/assets/hub/home.js')).headers.get('cache-control') ?? '', /public/);
});

test('only the Hub routes exist: Vault routes and odd paths are 404', async () => {
  const { hub } = await setup();
  for (const path of ['/api/v1/accounts', '/api/v1/today', '/hub/api/v1/accounts', '/hub/leads', '/hub/api/documents', '/admin', '/p/short', '/p/../etc', '/assets/../package.json', '/.env']) {
    const r = await get(hub, path);
    assert.ok(r.status === 404, `${path} -> ${r.status}`);
  }
});

test('only the expected methods work', async () => {
  const { hub } = await setup();
  for (const [m, path] of [['DELETE', '/'], ['PUT', '/contact'], ['POST', '/library'], ['PATCH', '/hub/api/library'], ['POST', '/assets/hub/home.js']] as const) {
    assert.equal((await get(hub, path, m)).status, 405, `${m} ${path}`);
  }
  assert.equal((await get(hub, '/', 'HEAD')).status, 200);
});

test('Contact creates a lead and rejects a bad email', async () => {
  const s = await setup();
  const before = await leads(s);
  assert.equal((await post(s.hub, '/hub/api/contact', { name: 'A', email: 'nope', message: 'x' })).status, 400);
  assert.equal(await leads(s), before);
  const ok = await post(s.hub, '/hub/api/contact', { name: 'Pat Doe', company: 'Doe Foods', email: 'pat@example.com', message: 'Need help with a filler.', sourceContext: { tool: 'Library', entryTitle: 'Vision inspection requirements' } });
  assert.equal(ok.status, 200);
  const all = await s.store.list('lead');
  const lead = all.find((l) => l.email === 'pat@example.com')!;
  assert.equal(lead.status, 'New');
  assert.equal(lead.source, 'contact_form');
  assert.equal(lead.sourceContext.entryTitle, 'Vision inspection requirements');
  assert.match(lead.number, /^BC-D-/);
});

test('Contact: the honeypot says "received" and stores nothing', async () => {
  const s = await setup();
  const before = await leads(s);
  const r = await post(s.hub, '/hub/api/contact', { name: 'Bot', email: 'bot@example.com', message: 'buy now', website: 'http://spam.example' });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { received: true });
  assert.equal(await leads(s), before);
});

test('Contact: size and length limits', async () => {
  const s = await setup();
  const long = await post(s.hub, '/hub/api/contact', { name: 'A', email: 'a@example.com', message: 'x'.repeat(10_001) });
  assert.equal(long.status, 400);
  assert.ok(((await long.json()) as any).error.fields.message);
  const huge = await post(s.hub, '/hub/api/contact', { name: 'A', email: 'a@example.com', message: 'x', attachment: { fileName: 'a.pdf', contentBase64: 'A'.repeat(9 * 1024 * 1024) } });
  assert.equal(huge.status, 413);
  assert.equal((await post(s.hub, '/hub/api/contact', 'not json')).status, 400);
  assert.equal((await post(s.hub, '/hub/api/contact', '[1,2]')).status, 400);
  assert.equal(await leads(s), (await s.store.list('lead')).length);
});

test('Contact: an attached file is stored with the lead', async () => {
  const s = await setup();
  const content = Buffer.from('%PDF-1.4 sample').toString('base64');
  const r = await post(s.hub, '/hub/api/contact', { name: 'A', email: 'file@example.com', message: 'See attached', attachment: { fileName: 'drawing.pdf', mimeType: 'application/pdf', contentBase64: content } });
  assert.equal(r.status, 200);
  const lead = (await s.store.list('lead')).find((l) => l.email === 'file@example.com')!;
  const doc = await s.store.get('document', lead.attachmentDocumentId);
  assert.equal(doc!.title, 'drawing.pdf');
  assert.equal(doc!.visibility, 'Private', 'a customer upload is never public');
  assert.equal(doc!.linked.recordId, lead.id);
});

test('Contact: with Turnstile on, a missing or failed check is refused', async () => {
  const calls: string[] = [];
  const fetchImpl = (async (_u: string, init: RequestInit) => { const t = String(init.body); calls.push(t); return new Response(JSON.stringify({ success: t.includes('response=good') })); }) as unknown as typeof fetch;
  const s = await setup({ turnstile: { secret: 's3cret', siteKey: 'site', fetchImpl } });
  const before = await leads(s);
  assert.equal((await post(s.hub, '/hub/api/contact', { name: 'A', email: 'a@example.com', message: 'x' })).status, 400, 'no token');
  assert.equal((await post(s.hub, '/hub/api/contact', { name: 'A', email: 'a@example.com', message: 'x', turnstileToken: 'bad' })).status, 400, 'failed check');
  assert.equal(await leads(s), before);
  assert.equal((await post(s.hub, '/hub/api/contact', { name: 'A', email: 'ok@example.com', message: 'x', turnstileToken: 'good' })).status, 200);
  assert.equal(await leads(s), before + 1);
  assert.ok(calls.every((c) => c.includes('secret=s3cret')));
  const csp = (await get(s.hub, '/')).headers.get('content-security-policy')!;
  assert.ok(csp.includes('challenges.cloudflare.com'), 'the check is allowed to load only when it is on');
});

test('Turnstile failure to reach Cloudflare refuses rather than lets spam through', async () => {
  const fetchImpl = (async () => { throw new Error('network'); }) as unknown as typeof fetch;
  const s = await setup({ turnstile: { secret: 'x', siteKey: 'y', fetchImpl } });
  assert.equal((await post(s.hub, '/hub/api/contact', { name: 'A', email: 'a@example.com', message: 'x', turnstileToken: 'good' })).status, 400);
});

test('customer link: the page serves for any well-formed token and the API decides', async () => {
  const s = await setup();
  const link = await s.vaultApi('POST', '/share-links', { projectId: 'proj-1', scope: { type: 'view' }, documentIds: [], expiresAt: '2026-12-31T00:00:00Z' });
  const token = link.json.token as string;
  assert.equal((await get(s.hub, `/p/${token}`)).status, 200);
  const data = await get(s.hub, `/hub/p/${token}`);
  assert.equal(data.status, 200);
  const page = (await data.json()) as any;
  assert.equal(page.folders.flatMap((f: any) => f.documents).length, 2);
  assert.ok(!JSON.stringify(page).includes('BC-'), 'no registry numbers');
  assert.equal((await get(s.hub, '/hub/p/tok_doesnotexist12345')).status, 404);
  const file = await get(s.hub, page.folders[0].documents[0].downloadPath);
  assert.equal(file.status, 200);
  assert.match(file.headers.get('content-disposition') ?? '', /attachment/);
  assert.equal((await get(s.hub, `/hub/p/${token}/files/doc-po-1`)).status, 404, 'private document through a link');
  await s.vaultApi('POST', `/share-links/${link.json.shareLink.id}/revoke`);
  assert.equal((await get(s.hub, `/hub/p/${token}`)).status, 410);
});

test('upload through a link: one item, once, with the right size and token', async () => {
  const s = await setup();
  const item = (await s.store.list('checklistItem', { filters: { name: 'Project schedule export' } }))[0]!;
  const req = await s.vaultApi('POST', `/checklist-items/${item.id}/request`, { expiresAt: '2026-12-31T00:00:00Z' });
  const token = req.json.token as string;
  const up = (id: string, body: string, t = token) => s.hub(new Request(`${BASE}/hub/p/${t}/uploads/${id}`, { method: 'POST', headers: { 'x-file-name': 'plan.pdf', 'content-type': 'application/pdf' }, body }));
  assert.equal((await up('some-other-item', 'x')).status, 403);
  assert.equal((await up(item.id, 'x', 'tok_wrongtokenwrongtoken')).status, 404);
  assert.equal((await up(item.id, '')).status, 400, 'empty file');
  assert.equal((await up(item.id, 'PDF bytes')).status, 200);
  assert.equal((await s.store.get('checklistItem', item.id))!.status, 'Received');
  assert.equal((await up(item.id, 'again')).status, 409, 'a second upload to the same item');
});

test('over the real service binding, refusals stay refusals (409, 403, 413, 400) and are not turned into 500s', async () => {
  const v = await makeVault();
  const hub = createHub({ vault: overRpc(v.app.publicApi), assets: assetsFromDisk });
  const item = (await v.store.list('checklistItem', { filters: { name: 'Project schedule export' } }))[0]!;
  const req = await v.vaultApi('POST', `/checklist-items/${item.id}/request`, { expiresAt: '2026-12-31T00:00:00Z' });
  const token = req.json.token as string;
  const up = (id: string, body: string) => hub(new Request(`${BASE}/hub/p/${token}/uploads/${id}`, { method: 'POST', headers: { 'x-file-name': 'a.pdf' }, body }));
  assert.equal((await up('another-item', 'x')).status, 403, 'a link used for the wrong item');
  assert.equal((await up(item.id, '')).status, 400, 'an empty file');
  assert.equal((await up(item.id, 'bytes')).status, 200);
  const again = await up(item.id, 'bytes');
  assert.equal(again.status, 409, 'a second upload');
  assert.equal(((await again.json()) as any).error.code, 'invalid_transition');
  assert.equal((await hub(new Request(`${BASE}/hub/p/tok_neverissuednever00/files/doc-manual-1`))).status, 404);
  const bad = await hub(new Request(`${BASE}/hub/api/contact`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'x', email: 'nope', message: 'm' }) }));
  assert.equal(bad.status, 400);
  // A real bug is still a 500 and is not dressed up as something else.
  const broken = createHub({ vault: { ...overRpc(v.app.publicApi), listLibrary: async () => { throw new Error('database is on fire'); } }, assets: assetsFromDisk });
  const r = await broken(new Request(`${BASE}/hub/api/library`));
  assert.equal(r.status, 500);
  assert.ok(!(await r.text()).includes('on fire'), 'internal messages are not shown to visitors');
});

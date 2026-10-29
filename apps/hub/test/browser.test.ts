/**
 * The Hub in a real browser: Chromium at phone and iPad sizes, using the built pages, the design system components and a real
 * Vault behind the narrow interface. Skipped if Playwright is not installed.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startHub } from './helpers.ts';

type Pw = { chromium: { launch(opts?: unknown): Promise<import('playwright').Browser> } };
let pw: Pw | null = null;
try { pw = createRequire(import.meta.url)('playwright') as Pw; } catch { pw = null; }
const SHOTS = process.env.SHOT_DIR;

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'ipad-portrait', width: 820, height: 1180 },
  { name: 'ipad-landscape', width: 1180, height: 820 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

let hub: Awaited<ReturnType<typeof startHub>>;
let browser: import('playwright').Browser;
before(async () => { if (!pw) return; hub = await startHub(); browser = await pw.chromium.launch(); });
after(async () => { await browser?.close(); await hub?.close(); });

const skip = { skip: pw ? false : 'Playwright is not installed' };

async function open(vp: (typeof VIEWPORTS)[number], path: string) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.width < 1000 });
  const page = await ctx.newPage();
  const problems: string[] = [];
  page.on('pageerror', (e: Error) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m: { type(): string; text(): string }) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('requestfailed', (r: { url(): string }) => problems.push(`requestfailed: ${r.url()}`));
  await page.goto(hub.url + path, { waitUntil: 'networkidle' });
  return { ctx, page, problems };
}
const noSideScroll = (page: import('playwright').Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const shot = async (page: import('playwright').Page, name: string) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }); };

for (const vp of VIEWPORTS) {
  test(`[${vp.name}] Hub home, Contact and Library draw without errors or sideways scroll`, skip, async () => {
    for (const path of ['/', '/contact', '/library']) {
      const { ctx, page, problems } = await open(vp, path);
      assert.equal(await page.locator('h1').count(), 1, `${path} has one h1`);
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
      assert.ok(await noSideScroll(page), `${path} scrolls sideways at ${vp.width}px`);
      assert.deepEqual(problems, [], `${path}: ${problems.join('; ')}`);
      await shot(page, `${vp.name}-${path === '/' ? 'home' : path.slice(1)}`);
      await ctx.close();
    }
  });
}

test('Contact: a customer fills the form on a phone and the lead reaches the Vault', skip, async () => {
  const { ctx, page, problems } = await open(VIEWPORTS[0], '/contact?tool=Library&entry=Vision%20inspection%20requirements');
  await page.getByLabel('Name').fill('Taylor Reed');
  await page.getByLabel('Company').fill('Reed Packaging');
  await page.getByLabel('Email').fill('taylor@example.com');
  await page.getByLabel('Phone').fill('555-0142');
  await page.getByLabel('What do you need?').fill('Bottles tip over at the labeler.');
  const box = await page.getByLabel('Leave this empty').boundingBox();
  assert.ok(box && box.x < -1000, 'the honeypot is far off-screen');
  assert.equal(await page.locator('[aria-hidden="true"] input[name="website"][tabindex="-1"]').count(), 1, 'hidden from screen readers and the keyboard');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByText('We received your message').waitFor();
  const lead = (await hub.store.list('lead')).find((l) => l.email === 'taylor@example.com');
  assert.ok(lead, 'the lead is in the Vault');
  assert.equal(lead.name, 'Taylor Reed');
  assert.equal(lead.company, 'Reed Packaging');
  assert.equal(lead.sourceContext.entryTitle, 'Vision inspection requirements');
  assert.equal(lead.status, 'New');
  await shot(page, 'phone-contact-sent');
  assert.deepEqual(problems, []);
  await ctx.close();
});

test('Contact: only the email is checked, and a bad one is explained', skip, async () => {
  const { ctx, page } = await open(VIEWPORTS[0], '/contact');
  const before = (await hub.store.list('lead')).length;
  await page.getByLabel('Email').fill('not-an-email');
  await page.getByLabel('Phone').click();
  await page.getByText('Enter an email address like name@company.com').waitFor();
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.waitForTimeout(300);
  assert.equal((await hub.store.list('lead')).length, before, 'nothing is stored for a bad email');
  await ctx.close();
});

test('Contact: attaching a file sends it with the lead', skip, async () => {
  const { ctx, page } = await open(VIEWPORTS[1], '/contact');
  await page.getByLabel('Email').fill('filer@example.com');
  await page.getByLabel('What do you need?').fill('See the attached drawing.');
  await page.locator('input[type=file]').setInputFiles({ name: 'cell-layout.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 layout') });
  await page.getByText('cell-layout.pdf').first().waitFor();
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByText('We received your message').waitFor();
  const lead = (await hub.store.list('lead')).find((l) => l.email === 'filer@example.com')!;
  const doc = await hub.store.get('document', lead.attachmentDocumentId);
  assert.equal(doc!.title, 'cell-layout.pdf');
  await ctx.close();
});

test('Contact: a file over 5 MB is refused before it is sent', skip, async () => {
  const { ctx, page } = await open(VIEWPORTS[1], '/contact');
  await page.locator('input[type=file]').setInputFiles({ name: 'big.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await page.getByText('That file is larger than 5 MB').waitFor();
  await ctx.close();
});

test('Library: choose a topic and a document, read it, and download it', skip, async () => {
  for (const vp of [VIEWPORTS[0], VIEWPORTS[3]]) {
    const { ctx, page, problems } = await open(vp, '/library');
    await page.getByRole('tab', { name: 'Controls' }).waitFor();
    await page.getByRole('option', { name: 'Enclosures' }).click();
    await page.getByRole('option', { name: 'Conveyor enclosure application requirements' }).click();
    await page.getByText('Before asking for a quote on a panel or drive replacement.').waitFor();
    const href = await page.getByRole('link', { name: /Download PDF/ }).getAttribute('href');
    assert.match(href!, /^\/hub\/api\/library\/doc-library-1\/file$/);
    const res = await page.request.get(hub.url + href!);
    assert.equal(res.status(), 200);
    assert.match(res.headers()['content-type'] ?? '', /pdf/);
    const askLink = page.getByRole('link', { name: 'Ask about this document' });
    const ask = await askLink.getAttribute('href');
    const [a, f, wm] = [await askLink.boundingBox(), await page.locator('footer').boundingBox(), await page.locator('footer .bc-wordmark').first().boundingBox()];
    assert.ok(a && f && a.y + a.height <= f.y + 1, 'the button sits above the footer');
    if (a && wm) assert.ok(a.y + a.height <= wm.y || a.x + a.width <= wm.x || wm.x + wm.width <= a.x, 'the button does not overlap the footer logo');
    assert.match(ask!, /^\/contact\?tool=Library&entry=Conveyor/);
    await shot(page, `${vp.name}-library-entry`);
    assert.deepEqual(problems, []);
    await ctx.close();
  }
});

test('Library never shows private documents', skip, async () => {
  const { ctx, page } = await open(VIEWPORTS[3], '/library');
  const text = await page.locator('body').innerText();
  for (const secret of ['purchase order', 'Meridian', 'BC-D-', 'BC-Q-', 'PO-77310', 'Torque station']) assert.ok(!text.includes(secret), `shows "${secret}"`);
  await ctx.close();
});

test('Customer link: downloads work, nothing private shows, and there is no navigation away', skip, async () => {
  const link = await hub.vaultApi('POST', '/share-links', { projectId: 'proj-1', scope: { type: 'view' }, documentIds: [], expiresAt: '2026-12-31T00:00:00Z' });
  const token = link.json.token as string;
  for (const vp of [VIEWPORTS[0], VIEWPORTS[1]]) {
    const { ctx, page, problems } = await open(vp, `/p/${token}`);
    await page.getByRole('heading', { name: 'Cap torque measurement station' }).waitFor();
    await page.getByText('This link works until December 31, 2026.').waitFor();
    const body = await page.locator('body').innerText();
    assert.ok(body.includes('Torque station operating manual') && body.includes('Torque station spec sheet'));
    for (const secret of ['BC-', 'purchase order', 'PO-77310', 'Meridian', 'drawing', '4850000', '48,500']) assert.ok(!body.toLowerCase().includes(secret.toLowerCase()), `shows "${secret}"`);
    assert.equal(await page.getByRole('navigation').count(), 0, 'a customer page has no navigation');
    assert.equal(await page.locator('a[href^="/contact"], a[href^="/library"]').count(), 0);
    assert.ok(await noSideScroll(page));
    const links = await page.getByRole('link', { name: 'Download' }).evaluateAll((els: Element[]) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href')));
    assert.equal(links.length, 2);
    for (const href of links) {
      const res = await page.request.get(hub.url + href!);
      assert.equal(res.status(), 200);
      assert.match(res.headers()['content-disposition'] ?? '', /attachment/);
    }
    const headers = (await page.request.get(hub.url + `/p/${token}`)).headers();
    assert.equal(headers['cache-control'], 'no-store');
    assert.equal(headers['referrer-policy'], 'no-referrer');
    await shot(page, `${vp.name}-customer`);
    assert.deepEqual(problems, []);
    await ctx.close();
  }
});

test('Customer link: a customer sends a requested file from an iPad', skip, async () => {
  const item = (await hub.store.list('checklistItem', { filters: { name: 'ROI summary' } }))[0]!;
  const req = await hub.vaultApi('POST', `/checklist-items/${item.id}/request`, { expiresAt: '2026-12-31T00:00:00Z' });
  const { ctx, page, problems } = await open(VIEWPORTS[1], `/p/${req.json.token}`);
  await page.getByText('Files we asked for').waitFor();
  await page.locator('input[type=file]').setInputFiles({ name: 'roi.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 roi') });
  await shot(page, 'ipad-customer-upload-ready');
  await page.getByRole('button', { name: 'Send file' }).click();
  await page.getByText('We received roi.pdf.').waitFor();
  await page.getByText('Files we asked for').waitFor({ state: 'detached' });
  assert.equal((await hub.store.get('checklistItem', item.id))!.status, 'Received');
  const doc = (await hub.store.list('document')).find((d) => d.title === 'roi.pdf')!;
  assert.equal(doc.visibility, 'Private', 'a customer upload starts private');
  assert.equal(doc.checksum.length, 64);
  assert.deepEqual(problems, []);
  await ctx.close();
});

test('Customer link: expired, revoked and unknown links say so and show nothing', skip, async () => {
  const a = await hub.vaultApi('POST', '/share-links', { projectId: 'proj-1', scope: { type: 'view' }, documentIds: [], expiresAt: '2026-10-30T00:00:00Z' });
  hub.setNow('2026-11-05T00:00:00Z');
  const exp = await open(VIEWPORTS[0], `/p/${a.json.token}`);
  await exp.page.getByText('This link has expired').waitFor();
  assert.ok(!(await exp.page.locator('body').innerText()).includes('Torque station'));
  await exp.ctx.close();
  hub.setNow('2026-10-29T15:00:00Z');
  const b = await hub.vaultApi('POST', '/share-links', { projectId: 'proj-1', scope: { type: 'view' }, documentIds: [], expiresAt: '2026-12-31T00:00:00Z' });
  await hub.vaultApi('POST', `/share-links/${b.json.shareLink.id}/revoke`);
  const rev = await open(VIEWPORTS[0], `/p/${b.json.token}`);
  await rev.page.getByText('This link is no longer active').waitFor();
  await rev.ctx.close();
  const unk = await open(VIEWPORTS[0], '/p/tok_this_link_was_never_issued');
  await unk.page.getByText('We could not find this page').waitFor();
  await shot(unk.page, 'phone-customer-notfound');
  await unk.ctx.close();
});

test('keyboard: Contact can be completed and sent without a mouse', skip, async () => {
  const { ctx, page } = await open(VIEWPORTS[3], '/contact');
  await page.getByLabel('Email').focus();
  await page.keyboard.type('keys@example.com');
  await page.keyboard.press('Tab'); // phone
  await page.keyboard.press('Tab'); // message
  await page.keyboard.type('Sent from the keyboard.');
  const focusable = await page.evaluate(() => { const el = document.activeElement as HTMLElement; return el.tagName; });
  assert.equal(focusable, 'TEXTAREA');
  await page.getByRole('button', { name: 'Send message' }).focus();
  await page.keyboard.press('Enter');
  await page.getByText('We received your message').waitFor();
  assert.ok((await hub.store.list('lead')).some((l) => l.email === 'keys@example.com'));
  await ctx.close();
});

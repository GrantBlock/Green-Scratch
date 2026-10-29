/**
 * The proof-of-concept story, as tests. Run against any server that implements the contract (the mock, or the real Vault
 * with its Hub routes). Register with registerStory('name', start).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { AssistantAnswer, ContactReceipt, LibraryIndex, SharePage, projectCompleteness, validateDataset } from '@bc/contract';
import type { Harness } from './harness.ts';

export const STORY_NOW = '2026-10-29T15:00:00Z';

export function registerStory(label: string, start: () => Promise<Harness>): void {
  let h: Harness;
  before(async () => { h = await start(); });
  after(async () => { await h.close(); });

  type Res = { status: number; json: any };
  async function call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<Res> {
    const isBytes = body instanceof Uint8Array;
    const r = await fetch(h.url + path, { method, headers: { ...(body && !isBytes ? { 'content-type': 'application/json' } : {}), ...headers }, body: body ? (isBytes ? (body as unknown as BodyInit) : JSON.stringify(body)) : undefined });
    const ct = r.headers.get('content-type') ?? '';
    return { status: r.status, json: ct.includes('json') ? await r.json() : await r.text() };
  }
  const api = (m: string, p: string, b?: unknown) => call(m, `/api/v1${p}`, b);
  const state: Record<string, any> = {};
  const name = (n: string) => `[${label}] ${n}`;


  test(name('1 a visitor sends a Contact inquiry; a bad email is refused'), async () => {
    const bad = await call('POST', '/hub/api/contact', { name: 'X', email: 'not-an-email', message: 'hi' });
    assert.equal(bad.status, 400);
    const ok = await call('POST', '/hub/api/contact', { name: 'Casey Lund', company: 'Example Dairy', email: 'casey@example.com', message: 'Need a case sealer inspection station.', sourceContext: { tool: 'Library', entryTitle: 'Vision inspection requirements' } });
    assert.equal(ok.status, 200);
    assert.ok(ContactReceipt.safeParse(ok.json).success);
  const withFile = await call('POST', '/hub/api/contact', { name: 'Dana Pike', email: 'dana@example.com', message: 'Drawing attached.', attachment: { fileName: 'drawing.pdf', mimeType: 'application/pdf', contentBase64: btoa('%PDF-1.4 sample') } });
  assert.equal(withFile.status, 200, 'a Contact message with an attached file is accepted');
  });

  test(name('2 it appears in the Inbox and on Today'), async () => {
    const leads = await api('GET', '/leads?status=New');
    const lead = leads.json.items.find((l: any) => l.name === 'Casey Lund');
    assert.ok(lead, 'new lead is in the Inbox');
    assert.match(lead.number, /^BC-D-26\d{3}$/);
    state.lead = lead;
    const today = await api('GET', '/today');
    assert.ok(today.json.newLeads.some((l: any) => l.id === lead.id));
  });

  test(name('3 Grant qualifies it: account, opportunity and a new BC-Q'), async () => {
    const q = await api('POST', `/leads/${state.lead.id}/qualify`, { newAccount: { name: 'Example Dairy', kind: 'Prospect', clientCode: 'GEN', industries: ['Food'] }, opportunityTitle: 'Case sealer inspection', scopeSummary: 'Camera check on sealed cases.', estimatedValueCents: 2750000 });
    assert.equal(q.status, 200);
    assert.equal(q.json.lead.status, 'Qualified');
    assert.equal(q.json.opportunity.number, 'BC-Q-26021', 'next number after the highest used');
    state.opp = q.json.opportunity;
    const again = await api('POST', `/leads/${state.lead.id}/qualify`, { newAccount: { name: 'Again', kind: 'Prospect', clientCode: 'GEN' }, opportunityTitle: 'x', scopeSummary: '', estimatedValueCents: 1 });
    assert.equal(again.status, 409, 'a lead cannot be qualified twice');
  });

  test(name('4 Won activates a project with folders, checklist, jobs, milestones and a schedule'), async () => {
    const w = await api('POST', `/opportunities/${state.opp.id}/win`, { templateId: 'tpl-project', cgmp: false, contractValueCents: 2750001 });
    assert.equal(w.status, 200);
    assert.equal(w.json.project.number, 'BC-B-26021', 'same digits as the quote');
    assert.equal(w.json.checklistItems.length, 9);
    assert.equal(w.json.jobs.length, 3);
    assert.equal(w.json.milestones.reduce((s: number, m: any) => s + m.amountCents, 0), 2750001, 'cents add up exactly, no rounding drift');
    assert.equal(w.json.scheduleItems.length, 6);
    state.project = w.json.project; state.items = w.json.checklistItems; state.ms = w.json.milestones; state.sched = w.json.scheduleItems;
    const lost = await api('POST', `/opportunities/${state.opp.id}/lose`, { reason: 'changed mind' });
    assert.equal(lost.status, 409, 'a Won opportunity cannot be Lost');
    const view = await api('GET', `/projects/${state.project.id}`);
    assert.equal(view.json.completeness, 0);
  });

  test(name('5 a customer uploads a requested file through an expiring link'), async () => {
    const item = state.items.find((i: any) => i.name === 'Customer purchase order');
    const req = await api('POST', `/checklist-items/${item.id}/request`, { expiresAt: '2026-12-31T00:00:00Z' });
    assert.equal(req.status, 201);
    const token = req.json.token;
    const page = await call('GET', `/hub/p/${token}`);
    assert.equal(page.status, 200);
    assert.ok(SharePage.safeParse(page.json).success);
    assert.equal(page.json.uploadSlots.length, 1);
    const up = await call('POST', `/hub/p/${token}/uploads/${item.id}`, new TextEncoder().encode('PO bytes'), { 'x-file-name': 'PO-100.pdf' });
    assert.equal(up.status, 200);
    const after = (await api('GET', `/checklist-items/${item.id}`)).json;
    assert.equal(after.status, 'Received');
    assert.equal(after.documentIds.length, 1);
    const twice = await call('POST', `/hub/p/${token}/uploads/${item.id}`, new TextEncoder().encode('again'), { 'x-file-name': 'again.pdf' });
    assert.equal(twice.status, 409);
    const other = state.items.find((i: any) => i.name === 'Mechanical drawings');
    const wrong = await call('POST', `/hub/p/${token}/uploads/${other.id}`, new TextEncoder().encode('x'));
    assert.equal(wrong.status, 403, 'a link only uploads to its own item');
    const view = await api('GET', `/projects/${state.project.id}`);
    assert.ok(view.json.completeness > 0);
  });

  test(name('6 the Gantt: moving a date needs a reason; a baseline snapshots the plan'), async () => {
    const item = state.sched[3];
    const noReason = await api('POST', `/schedule-items/${item.id}/move`, { start: '2026-12-01', end: '2026-12-10' });
    assert.equal(noReason.status, 400);
    const backwards = await api('POST', `/schedule-items/${item.id}/move`, { start: '2026-12-10', end: '2026-12-01', reason: 'x' });
    assert.equal(backwards.status, 400);
    const bl = await api('POST', `/projects/${state.project.id}/baselines`, { name: 'Contract' });
    assert.equal(bl.json.items.length, 6);
    const moved = await api('POST', `/schedule-items/${item.id}/move`, { start: '2026-12-01', end: '2026-12-10', reason: 'Parts arrive later.' });
    assert.equal(moved.status, 200);
    assert.equal(moved.json.update.kind, 'date_change');
    assert.equal(moved.json.update.reason, 'Parts arrive later.');
    const baseItem = bl.json.items.find((i: any) => i.scheduleItemId === item.id);
    assert.notEqual(baseItem.start, moved.json.scheduleItem.start, 'the baseline keeps the old dates');
  });

  test(name('7 a visit planned this week shows on Today'), async () => {
    const ev = await api('POST', '/events', { kind: 'Customer visit', title: 'Kickoff at Example Dairy', start: '2026-11-02T09:00:00-06:00', allDay: false, accountIds: [], contactIds: [], photoDocumentIds: [], projectId: state.project.id });
    assert.equal(ev.status, 201);
    const today = await api('GET', '/today');
    assert.ok(today.json.visits.some((e: any) => e.id === ev.json.id));
  });

  test(name('8 a milestone becomes a Draft invoice, is sent, goes overdue and is paid'), async () => {
    const m = state.ms[0];
    const inv = await api('POST', `/milestones/${m.id}/invoice`, { dueDate: '2026-10-10' });
    assert.equal(inv.json.invoice.status, 'Draft');
    assert.equal(inv.json.invoice.displayStatus, 'Draft', 'nothing is sent automatically');
    const sent = await api('POST', `/invoices/${inv.json.invoice.id}/send`, { issuedDate: '2026-09-10' });
    assert.equal(sent.json.displayStatus, 'Overdue');
    assert.equal(sent.json.daysLate, 19);
    const today = await api('GET', '/today');
    assert.ok(today.json.overdueInvoices.some((o: any) => o.invoice.id === inv.json.invoice.id));
    const paid = await api('POST', `/invoices/${inv.json.invoice.id}/paid`, { paidDate: '2026-10-29' });
    assert.equal(paid.json.status, 'Paid');
    assert.equal((await api('GET', `/milestones/${m.id}`)).json.status, 'Paid');
    const resend = await api('POST', `/invoices/${inv.json.invoice.id}/send`, {});
    assert.equal(resend.status, 409);
  });

  test(name('9 customer links show only Released, Customer-shared documents of their project'), async () => {
    const link = await api('POST', '/share-links', { projectId: 'proj-1', scope: { type: 'view' }, documentIds: [], expiresAt: '2026-12-31T00:00:00Z' });
    const page = await call('GET', `/hub/p/${link.json.token}`);
    const titles = page.json.folders.flatMap((f: any) => f.documents.map((d: any) => d.title));
    assert.deepEqual(titles.sort(), ['Torque station operating manual', 'Torque station spec sheet']);
    assert.ok(!JSON.stringify(page.json).includes('BC-'), 'no registry numbers reach the customer');
    const file = await call('GET', page.json.folders[0].documents[0].downloadPath);
    assert.equal(file.status, 200);
    const priv = await call('GET', `/hub/p/${link.json.token}/files/doc-po-1`);
    assert.equal(priv.status, 404, 'a private document cannot be fetched through a link');
    const other = await call('GET', `/hub/p/${link.json.token}/files/doc-layout-2`);
    assert.equal(other.status, 404, 'nor a document of another project');
    const past = await api('POST', '/share-links', { projectId: 'proj-1', scope: { type: 'view' }, documentIds: [], expiresAt: '2026-10-01T00:00:00Z' });
    assert.equal(past.status, 400, 'a link cannot be created already expired');
    const soon = await api('POST', '/share-links', { projectId: 'proj-1', scope: { type: 'view' }, documentIds: [], expiresAt: '2026-11-01T00:00:00Z' });
    assert.equal((await call('GET', `/hub/p/${soon.json.token}`)).status, 200);
    h.setNow('2026-11-02T00:00:00Z');
    assert.equal((await call('GET', `/hub/p/${soon.json.token}`)).status, 410, 'an expired link stops working');
    h.setNow(STORY_NOW);
    await api('POST', `/share-links/${link.json.shareLink.id}/revoke`);
    assert.equal((await call('GET', `/hub/p/${link.json.token}`)).status, 410);
    assert.equal((await call('GET', '/hub/p/tok_made-up')).status, 404);
    const sneaky = await api('POST', '/share-links', { projectId: 'proj-1', scope: { type: 'view' }, documentIds: ['doc-po-1'], expiresAt: '2026-12-31T00:00:00Z' });
    assert.equal(sneaky.status, 400, 'a link cannot be made to expose a private document');
  });

  test(name('10 the public Library lists only Public, Released documents'), async () => {
    const lib = await call('GET', '/hub/api/library');
    assert.ok(LibraryIndex.safeParse(lib.json).success);
    assert.deepEqual(lib.json.entries.map((e: any) => e.id).sort(), ['doc-library-1', 'doc-library-2']);
    const e = lib.json.entries.find((x: any) => x.id === 'doc-library-1');
    assert.equal(e.revision, 2);
    assert.equal(e.revisions.length, 2);
    assert.equal((await call('GET', '/hub/api/library/doc-po-1')).status, 404);
    assert.equal((await call('GET', '/hub/api/library/doc-po-1/file')).status, 404);
  });

  test(name('11 the Hub routes cannot reach Vault data'), async () => {
    assert.equal((await call('GET', '/hub/api/v1/leads')).status, 404);
    assert.equal((await call('GET', '/hub/leads')).status, 404);
  });

  test(name('12 the assistant answers with citations; search finds records'), async () => {
    const a = await api('POST', '/assistant/ask', { question: 'What do we know about the cap torque station?' });
    assert.ok(AssistantAnswer.safeParse(a.json).success);
    assert.ok(a.json.citations.length > 0);
    const s = await api('GET', '/search?q=torque');
    assert.ok(s.json.hits.length >= 2);
  });

  test(name('13 guardrails: locked documents, stale versions, bad transitions, bad input'), async () => {
    const locked = await api('PATCH', '/documents/doc-po-1', { title: 'Renamed', version: 1 });
    assert.equal(locked.status, 409);
    assert.equal(locked.json.error.code, 'locked');
    const acc = (await api('GET', '/accounts/acc-meridian')).json;
    const ok = await api('PATCH', '/accounts/acc-meridian', { notes: 'Prefers Friday summaries.', version: acc.version });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.version, acc.version + 1);
    const stale = await api('PATCH', '/accounts/acc-meridian', { notes: 'again', version: acc.version });
    assert.equal(stale.json.error.code, 'conflict');
    const jump = await api('POST', '/projects/proj-2/stage', { stage: 'Install' });
    assert.equal(jump.json.error.code, 'invalid_transition');
    const noReason = await api('POST', '/opportunities/opp-4/lose', {});
    assert.equal(noReason.status, 400);
    const clientNumber = await api('POST', '/accounts', { name: 'Z', kind: 'Customer', clientCode: 'ZZZ', industries: [], number: 'BC-Q-99999', id: 'mine' });
    assert.notEqual(clientNumber.json.id, 'mine', 'the server sets ids');
    const badCode = await api('POST', '/accounts', { name: 'Z', kind: 'Customer', clientCode: 'zz', industries: [] });
    assert.equal(badCode.status, 400);
    assert.ok(badCode.json.error.fields.clientCode);
  });

  test(name('14 a number in use cannot be voided; a spare one can; none is ever reused'), async () => {
    const entry = (await api('GET', `/registry?number=${state.opp.number}`)).json.items[0];
    assert.ok(entry, 'the quote number is in the registry');
    const used = await api('POST', `/registry/${entry.id}/void`, { reason: 'oops' });
    assert.equal(used.status, 409);
    const spare = (await api('GET', '/registry?status=Void')).json.items[0];
    assert.ok(spare, 'a voided number stays in the registry');
    const c = await api('POST', '/leads', { source: 'manual', name: 'Phone call', message: 'x', receivedAt: '2026-10-29T12:00:00Z', status: 'New' });
    const nums = (await api('GET', '/registry')).json.items.map((r: any) => r.number);
    assert.equal(new Set(nums).size, nums.length, 'registry numbers are unique');
    assert.ok(c.json.number);
  });

  test(name('15 after the whole story the data still validates'), async () => {
    const ds = await h.dataset();
    const issues = validateDataset(ds);
    assert.deepEqual(issues, [], issues.map((i) => `${i.record}: ${i.message}`).join('\n'));
    assert.ok(projectCompleteness(ds.checklistItem.filter((c) => c.projectId === state.project.id)) > 0);
  });
}

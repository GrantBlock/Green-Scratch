import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixtures, FIXTURE_TODAY } from '../fixtures/data.ts';
import {
  canTransition, computeToday, createInputSchema, invoiceDisplayStatus, projectCompleteness, recordRuleIssues, schemas, updateInputSchema,
  validateDataset, allRoutes, resources, HUB_ALLOWED_PATHS, refRules, daysLate, numberDigits, Cents,
} from '../src/index.ts';
import type { AnyRecord } from '../src/index.ts';

const clone = <T,>(x: T): T => structuredClone(x);

test('fixtures validate against every schema, rule and link', () => {
  const issues = validateDataset(fixtures);
  assert.deepEqual(issues, [], issues.map((i) => `${i.record}: ${i.message}`).join('\n'));
});

test('every record type has fixtures except the ones Grant creates later', () => {
  const empty = Object.entries(fixtures).filter(([, v]) => v.length === 0).map(([k]) => k);
  assert.deepEqual(empty, []);
});

test('money is whole cents everywhere', () => {
  for (const inv of fixtures.invoice) { assert.ok(Cents.safeParse(inv.amountCents).success); for (const l of inv.lines) assert.ok(Number.isInteger(l.amountCents)); }
  assert.equal(Cents.safeParse(12.5).success, false);
});

test('a project shares its opportunity\'s digits and a lost number is not reused', () => {
  for (const p of fixtures.project) {
    const o = fixtures.opportunity.find((x) => x.id === p.opportunityId)!;
    assert.equal(numberDigits(p.number), numberDigits(o.number));
  }
  const voids = fixtures.registry.filter((r) => r.status === 'Void').map((r) => r.number);
  for (const n of voids) assert.ok(!fixtures.opportunity.some((o) => o.number === n));
});

test('milestones of each project total 100 percent', () => {
  for (const p of fixtures.project) {
    assert.equal(fixtures.milestone.filter((m) => m.projectId === p.id).reduce((s, m) => s + m.percent, 0), 100);
  }
});

test('overdue is derived from the due date', () => {
  const inv2 = fixtures.invoice.find((i) => i.id === 'inv-2')!;
  assert.equal(inv2.status, 'Sent');
  assert.equal(invoiceDisplayStatus(inv2, FIXTURE_TODAY), 'Overdue');
  assert.equal(invoiceDisplayStatus(inv2, '2026-10-09'), 'Sent');
  assert.equal(daysLate(inv2, FIXTURE_TODAY), 19);
  assert.equal(invoiceDisplayStatus(fixtures.invoice.find((i) => i.id === 'inv-1')!, FIXTURE_TODAY), 'Paid');
});

test('completeness counts required items at Received or better', () => {
  const p1 = fixtures.checklistItem.filter((c) => c.projectId === 'proj-1');
  assert.equal(projectCompleteness(p1), 100);
  const p2 = fixtures.checklistItem.filter((c) => c.projectId === 'proj-2');
  assert.ok(projectCompleteness(p2) < 100);
  assert.equal(projectCompleteness([]), 100);
});

test('state machines allow only the defined steps', () => {
  assert.ok(canTransition('opportunity', 'Open', 'Won'));
  assert.ok(!canTransition('opportunity', 'Won', 'Open'));
  assert.ok(canTransition('project', 'Design', 'Build'));
  assert.ok(!canTransition('project', 'Design', 'Install'));
  assert.ok(!canTransition('document', 'Released', 'Draft'));
  assert.ok(canTransition('invoice', 'Draft', 'Sent'));
  assert.ok(!canTransition('invoice', 'Paid', 'Sent'));
});

test('Today is computed from the data', () => {
  const t = computeToday(fixtures, FIXTURE_TODAY);
  assert.deepEqual(t.newLeads.map((l) => l.id), ['lead-1']);
  assert.deepEqual(t.followUpsDue.map((o) => o.id), ['opp-3']);
  assert.deepEqual(t.overdueInvoices.map((x) => [x.invoice.id, x.daysLate]), [['inv-2', 19]]);
  assert.ok(t.visits.some((e) => e.id === 'ev-2'));
  assert.ok(!t.visits.some((e) => e.id === 'ev-1'), 'past visits are not shown');
  assert.ok(t.missingDocuments.some((m) => m.item.id === 'ci-2-mech'));
});

// ---- Rules catch real mistakes ----------------------------------------------------------------------------------

const breaks = (rec: AnyRecord, fn: (r: AnyRecord) => void) => { const r = clone(rec); fn(r); return recordRuleIssues(r); };

test('rules: a Lost opportunity needs a reason', () => {
  const o = fixtures.opportunity.find((x) => x.status === 'Lost')!;
  assert.equal(breaks(o, (r) => { (r as typeof o).lostReason = ''; }).length, 1);
});
test('rules: invoice lines must add up to the amount', () => {
  const i = fixtures.invoice[0]!;
  assert.equal(breaks(i, (r) => { (r as typeof i).amountCents += 1; }).length, 1);
});
test('rules: only Released documents can be shared, and Temp, Inbox and Claude folders never', () => {
  const d = fixtures.document.find((x) => x.id === 'doc-mech-1')!;
  assert.equal(breaks(d, (r) => { (r as typeof d).visibility = 'Customer-shared'; }).length, 1);
  const shared = fixtures.document.find((x) => x.id === 'doc-manual-1')!;
  assert.equal(breaks(shared, (r) => { (r as typeof shared).location = { folder: 'Temp - Project' }; }).length, 1);
});
test('rules: a date change needs a reason', () => {
  const a = fixtures.activity.find((x) => x.kind === 'date_change')!;
  assert.equal(breaks(a, (r) => { (r as typeof a).reason = undefined; }).length, 1);
});
test('rules: knowledge scope matches its links', () => {
  const kk = fixtures.knowledgeItem.find((x) => x.scope === 'Project')!;
  assert.equal(breaks(kk, (r) => { (r as typeof kk).projectId = undefined; }).length, 1);
});

test('dataset validation reports broken links, duplicate numbers and cycles', () => {
  const ds = clone(fixtures);
  ds.invoice[0]!.projectId = 'proj-missing';
  ds.opportunity[1]!.number = ds.opportunity[0]!.number;
  ds.scheduleItem[0]!.dependsOn = ['si-2'];
  const msgs = validateDataset(ds).map((i) => i.message);
  assert.ok(msgs.some((m) => m.includes('proj-missing')));
  assert.ok(msgs.some((m) => m.includes('already used')));
  assert.ok(msgs.some((m) => m.includes('cycle')));
});

test('a share link cannot expose a document that is not Released and Customer-shared', () => {
  const ds = clone(fixtures);
  ds.shareLink[0]!.documentIds.push('doc-mech-1');
  assert.ok(validateDataset(ds).some((i) => i.message.includes('not a Released, Customer-shared')));
});

// ---- Routes --------------------------------------------------------------------------------------------------------

test('create and update bodies never accept server fields', () => {
  for (const key of Object.keys(resources) as (keyof typeof resources)[]) {
    const c = createInputSchema(key) as unknown as { shape: Record<string, unknown> };
    for (const f of ['id', 'version', 'createdAt', 'updatedAt', 'number', 'type']) assert.ok(!(f in c.shape), `${key} create accepts ${f}`);
    assert.ok('version' in (updateInputSchema(key) as unknown as { shape: Record<string, unknown> }).shape, `${key} update needs version`);
  }
});

test('every route name and method+path is unique', () => {
  const all = allRoutes();
  assert.equal(new Set(all.map((r) => r.name)).size, all.length);
  assert.equal(new Set(all.map((r) => `${r.method} ${r.path}`)).size, all.length);
});

test('the Hub may serve only its own routes', () => {
  assert.ok(HUB_ALLOWED_PATHS.every((p) => p.startsWith('/hub/')));
  assert.ok(allRoutes().filter((r) => r.audience === 'vault').every((r) => !r.path.startsWith('/hub/')));
});

test('every ref rule names fields that exist', () => {
  for (const r of refRules) {
    const shape = (schemas[r.from] as unknown as { shape: Record<string, unknown> }).shape;
    assert.ok(r.field in shape, `${r.from}.${r.field}`);
  }
});

/**
 * Mock API for the proof of concept. Implements every route in src/api.ts over in-memory data copied from the fixtures.
 * UI and Hub sessions build against this; the real server replaces it one record type at a time.
 * Run: npm run mock   (listens on http://localhost:8787)
 */
import http from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { fixtures, FIXTURE_NOW, FIXTURE_TODAY } from '../fixtures/data.ts';
import {
  API_BASE, AssistantAskInput, ContactSubmission, LoseInput, MoveInput, ProjectStructureDefinition, QualifyInput, WinInput, canTransition,
  computeToday, createInputSchema, daysLate, formatNumber, invoiceDisplayStatus, numberDigits, numberedTypes, projectCompleteness,
  recordRuleIssues, resources, schemas, updateInputSchema,
} from '../src/index.ts';
import type { Dataset, ResourceKey } from '../src/index.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type R = Record<string, any>;

export interface MockOptions { port?: number; today?: string; now?: string }
export interface MockServer { url: string; close(): Promise<void>; ds: Dataset }

class HttpError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
const bad = (message: string, fields?: Record<string, string>) => new HttpError(400, 'validation_failed', message, fields);
const missing = (what: string) => new HttpError(404, 'not_found', `${what} was not found.`);

export function startMock(opts: MockOptions = {}): Promise<MockServer> {
  const today = opts.today ?? FIXTURE_TODAY;
  const now = opts.now ?? FIXTURE_NOW;
  const yy = Number(today.slice(2, 4));
  const ds: Dataset = structuredClone(fixtures);
  const tokens = new Map<string, string>(); // token hash -> share link id
  let seq = 1000;
  const newId = (prefix: string) => `${prefix}-${++seq}`;
  const hash = (t: string) => createHash('sha256').update(t).digest('hex');

  // ---- helpers -----------------------------------------------------------------------------------------------------
  const list = <K extends keyof Dataset>(k: K) => ds[k] as unknown as R[];
  const find = (k: keyof Dataset, id: string): R => {
    const r = list(k).find((x) => x.id === id);
    if (!r) throw missing(`${String(k)} "${id}"`);
    return r;
  };
  const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

  const nextSeq = (type: string) => {
    let max = 0;
    for (const r of ds.registry) {
      const p = r.number.split('-');
      if (p[1] === type && p[2]!.startsWith(String(yy))) max = Math.max(max, Number(p[2]!.slice(2)));
    }
    return max + 1;
  };
  const issue = (type: string, about: R | undefined, explicit?: string): string => {
    const number = explicit ?? formatNumber(type, yy, nextSeq(type));
    if (ds.registry.some((r) => r.number === number)) throw new HttpError(409, 'conflict', `Number ${number} is already in the registry.`);
    ds.registry.push({ id: newId('reg'), version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'registry', number, registryType: type as never, status: 'Issued', about: about as never });
    return number;
  };
  const audit = (action: string, about: { recordType: string; recordId: string }, before?: unknown, after?: unknown, actor = 'grant') => {
    ds.audit.push({ id: newId('aud'), version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'audit', actor: actor as never, action, about: about as never, before, after, at: now });
  };
  const note = (about: { recordType: string; recordId: string }, kind: string, text: string, extra: R = {}) => {
    const a = { id: newId('act'), version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'activity', about, kind, text, actor: 'grant', at: now, ...extra };
    ds.activity.push(a as never);
    return a;
  };
  const check = (key: keyof Dataset, rec: R) => {
    const parsed = (schemas[key as keyof typeof schemas] as z.ZodType).safeParse(rec);
    if (!parsed.success) throw bad('The record is not valid.', Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.') || '_', i.message])));
    const rules = recordRuleIssues(rec as never);
    if (rules.length) throw bad(rules.join(' '));
  };
  const touch = (rec: R) => { rec.version += 1; rec.updatedAt = now; };
  const view = (key: string, rec: R): R => {
    if (key === 'project') return { ...rec, completeness: projectCompleteness(ds.checklistItem.filter((c) => c.projectId === rec.id)) };
    if (key === 'invoice') return { ...rec, displayStatus: invoiceDisplayStatus(rec as never, today), daysLate: invoiceDisplayStatus(rec as never, today) === 'Overdue' ? daysLate(rec as never, today) : 0 };
    return rec;
  };
  const parse = <T extends z.ZodType>(schema: T, body: unknown): z.infer<T> => {
    const p = schema.safeParse(body ?? {});
    if (!p.success) throw bad('The request is not valid.', Object.fromEntries(p.error.issues.map((i) => [i.path.join('.') || '_', i.message])));
    return p.data;
  };
  const step = (machine: Parameters<typeof canTransition>[0], from: string, to: string) => {
    if (!canTransition(machine, from, to)) throw new HttpError(409, 'invalid_transition', `A ${machine} cannot move from ${from} to ${to}.`);
  };
  const keyOfPath = (p: string) => (Object.entries(resources).find(([, v]) => v.path === p)?.[0]) as ResourceKey | undefined;

  // ---- generic records ---------------------------------------------------------------------------------------------
  const listRecords = (key: ResourceKey, q: URLSearchParams) => {
    let items = list(key as keyof Dataset);
    if (q.get('archived') !== 'true') items = items.filter((r) => !r.archived);
    for (const [f, v] of q) {
      if (['q', 'limit', 'cursor', 'archived', 'types'].includes(f)) continue;
      items = items.filter((r) => String(r[f]) === v);
    }
    const text = q.get('q')?.toLowerCase();
    if (text) items = items.filter((r) => JSON.stringify(r).toLowerCase().includes(text));
    const limit = Number(q.get('limit') ?? 200);
    return { items: items.slice(0, limit).map((r) => view(key, r)), nextCursor: null };
  };

  const createRecord = (key: ResourceKey, body: unknown) => {
    const input = parse(createInputSchema(key), body) as R;
    const rec: R = { id: newId(key), version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], ...input, type: key };
    const numType = (numberedTypes as R)[key];
    if (numType) rec.number = issue(numType, { recordType: key, recordId: rec.id });
    if (key === 'activity') { rec.at = rec.at ?? now; rec.actor = rec.actor ?? 'grant'; }
    check(key, rec);
    list(key).push(rec);
    audit(`${key}.create`, { recordType: key, recordId: rec.id }, undefined, rec);
    return view(key, rec);
  };

  const updateRecord = (key: ResourceKey, id: string, body: unknown) => {
    const rec = find(key, id);
    const input = parse(updateInputSchema(key), body) as R;
    if (input.version !== rec.version) throw new HttpError(409, 'conflict', 'This record changed since you loaded it. Reload and try again.');
    if (key === 'document' && rec.status === 'Released') throw new HttpError(409, 'locked', 'A Released document is locked. Create a new revision instead.');
    const before = structuredClone(rec);
    const { version: _v, ...changes } = input;
    for (const sk of ['status', 'stage']) if (changes[sk] !== undefined && changes[sk] !== rec[sk]) {
      const machine = key === 'project' ? 'project' : key;
      if (machine in { lead: 1, opportunity: 1, project: 1, checklistItem: 1, document: 1, invoice: 1, milestone: 1, job: 1, sourcingItem: 1 }) step(machine as never, rec[sk], changes[sk]);
    }
    const next = { ...rec, ...changes };
    check(key, next);
    Object.assign(rec, changes); touch(rec);
    audit(`${key}.update`, { recordType: key, recordId: id }, before, rec);
    return view(key, rec);
  };

  // ---- actions -----------------------------------------------------------------------------------------------------
  const actions: Record<string, (p: R, body: unknown, q: URLSearchParams, req: http.IncomingMessage) => unknown> = {
    'leads.qualify': (p, body) => {
      const lead = find('lead', p.id);
      const input = parse(QualifyInput, body);
      step('lead', lead.status, 'Qualified');
      let account: R;
      if (input.accountId) account = find('account', input.accountId);
      else {
        const a = input.newAccount!;
        account = { id: newId('acc'), version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'account', ...a };
        check('account', account); ds.account.push(account as never);
      }
      let contact: R | undefined;
      if (input.contactId) contact = find('contact', input.contactId);
      else if (input.newContact) {
        contact = { id: newId('con'), version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'contact', accountId: account.id, primary: true, ...input.newContact };
        check('contact', contact); ds.contact.push(contact as never);
      }
      const id = newId('opp');
      const opportunity: R = {
        id, version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'opportunity', number: issue('Q', { recordType: 'opportunity', recordId: id }),
        accountId: account.id, contactId: contact?.id, title: input.opportunityTitle, scopeSummary: input.scopeSummary, estimatedValueCents: input.estimatedValueCents,
        sourceLeadId: lead.id, status: 'Open', quoteDocumentIds: [],
      };
      check('opportunity', opportunity); ds.opportunity.push(opportunity as never);
      Object.assign(lead, { status: 'Qualified', accountId: account.id, opportunityId: id }); touch(lead);
      note({ recordType: 'lead', recordId: lead.id }, 'state_change', `Qualified. Opportunity ${opportunity.number} created.`, { actor: 'system' });
      audit('lead.qualify', { recordType: 'lead', recordId: lead.id }, undefined, { opportunityId: id });
      return { lead, account, contact, opportunity };
    },
    'leads.setStatus': (p, body) => {
      const lead = find('lead', p.id);
      const { status } = parse(z.object({ status: z.enum(['Contacted', 'Dismissed', 'New']) }), body);
      step('lead', lead.status, status);
      lead.status = status; touch(lead);
      return lead;
    },
    'opportunities.win': (p, body) => {
      const opp = find('opportunity', p.id);
      const input = parse(WinInput, body);
      step('opportunity', opp.status, 'Won');
      const tpl = find('template', input.templateId);
      const def = ProjectStructureDefinition.safeParse(tpl.definition);
      if (!def.success) throw bad('That template is not a project structure.');
      const D = def.data;
      const digits = numberDigits(opp.number);
      const pid = newId('proj');
      const project: R = {
        id: pid, version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'project', number: issue('B', { recordType: 'project', recordId: pid }, `BC-B-${digits}`),
        accountId: opp.accountId, opportunityId: opp.id, title: opp.title, contractValueCents: input.contractValueCents ?? opp.estimatedValueCents, stage: 'Design',
        templateId: tpl.id, cgmp: input.cgmp, onshapeUrls: [],
      };
      check('project', project); ds.project.push(project as never);
      const checklistItems = D.checklist.map((c) => ({ id: newId('ci'), version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'checklistItem', projectId: pid, location: c.location, name: c.name, required: c.required, status: 'Missing', documentIds: [] }));
      if (input.cgmp) {
        const cg = ds.template.find((t) => t.cgmpOption);
        const items = ((cg?.definition as R | undefined)?.checklist ?? []) as { name: string; required: boolean }[];
        for (const c of items) checklistItems.push({ id: newId('ci'), version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'checklistItem', projectId: pid, location: { folder: 'Documentation - Project', subfolder: 'cGMP Package' } as never, name: c.name, required: c.required, status: 'Missing', documentIds: [] });
      }
      const jobs = D.jobs.map((j) => ({ id: newId('job'), version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'job', number: issue('J', undefined), projectId: pid, category: j.category, description: j.description, status: 'Not started' }));
      const total = project.contractValueCents as number;
      let allocated = 0;
      const milestones = D.milestones.map((m, i) => {
        const amount = i === D.milestones.length - 1 ? total - allocated : Math.round((total * m.percent) / 100);
        allocated += amount;
        return { id: newId('ms'), version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'milestone', projectId: pid, name: m.name, percent: m.percent, amountCents: amount, dueDate: addDays(today, 30 * (i + 1)), status: 'Pending' };
      });
      const scheduleItems: R[] = [];
      D.schedule.forEach((s, i) => {
        const dep = s.dependsOnIndex != null ? scheduleItems[s.dependsOnIndex] : undefined;
        const start = dep ? addDays(dep.end, 1) : today;
        scheduleItems.push({ id: newId('si'), version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'scheduleItem', projectId: pid, name: s.name, category: s.category, start, end: addDays(start, s.durationDays - 1), dependsOn: dep ? [dep.id] : [], percentComplete: 0, sortOrder: i + 1 });
      });
      for (const [k, arr] of [['checklistItem', checklistItems], ['job', jobs], ['milestone', milestones], ['scheduleItem', scheduleItems]] as [keyof Dataset, R[]][]) {
        for (const r of arr) { check(k, r); list(k).push(r); }
      }
      Object.assign(opp, { status: 'Won', decidedDate: today, projectId: pid }); touch(opp);
      note({ recordType: 'opportunity', recordId: opp.id }, 'state_change', `Won. Project ${project.number} activated from "${tpl.name}".`, { actor: 'system' });
      audit('opportunity.win', { recordType: 'opportunity', recordId: opp.id }, undefined, { projectId: pid });
      return { opportunity: opp, project, checklistItems, jobs, milestones, scheduleItems };
    },
    'opportunities.lose': (p, body) => {
      const opp = find('opportunity', p.id);
      const { reason } = parse(LoseInput, body);
      step('opportunity', opp.status, 'Lost');
      Object.assign(opp, { status: 'Lost', lostReason: reason, decidedDate: today }); touch(opp);
      return opp;
    },
    'opportunities.reopen': (p) => {
      const opp = find('opportunity', p.id);
      step('opportunity', opp.status, 'Open');
      Object.assign(opp, { status: 'Open', lostReason: undefined, decidedDate: undefined }); touch(opp);
      return opp;
    },
    'projects.setStage': (p, body) => {
      const proj = find('project', p.id);
      const { stage } = parse(z.object({ stage: z.enum(['Design', 'Build', 'Install', 'Closed']) }), body);
      step('project', proj.stage, stage);
      const before = proj.stage;
      proj.stage = stage; touch(proj);
      note({ recordType: 'project', recordId: proj.id }, 'state_change', `Stage changed from ${before} to ${stage}.`, { actor: 'system' });
      return view('project', proj);
    },
    'projects.createBaseline': (p, body) => {
      const proj = find('project', p.id);
      const { name } = parse(z.object({ name: z.string().min(1) }), body);
      const items = ds.scheduleItem.filter((s) => s.projectId === proj.id).map((s) => ({ scheduleItemId: s.id, start: s.start, end: s.end, percentComplete: s.percentComplete }));
      const b = { id: newId('bl'), version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'baseline', projectId: proj.id, name, takenAt: now, items };
      check('baseline', b); ds.baseline.push(b as never);
      return b;
    },
    'checklistItems.setStatus': (p, body) => {
      const item = find('checklistItem', p.id);
      const input = parse(z.object({ status: z.enum(['Missing', 'Requested', 'Received', 'In review', 'Released']), documentId: z.string().optional() }), body);
      step('checklistItem', item.status, input.status);
      if (input.documentId) { find('document', input.documentId); item.documentIds = [...new Set([...item.documentIds, input.documentId])]; }
      item.status = input.status;
      check('checklistItem', item); touch(item);
      return item;
    },
    'checklistItems.requestUpload': (p, body) => {
      const item = find('checklistItem', p.id);
      const { expiresAt } = parse(z.object({ expiresAt: z.string() }), body);
      if (item.status === 'Missing') item.status = 'Requested'; else if (item.status !== 'Requested') throw new HttpError(409, 'invalid_transition', `Item is already ${item.status}.`);
      touch(item);
      return makeLink({ projectId: item.projectId, scope: { type: 'upload', checklistItemId: item.id }, documentIds: [], expiresAt });
    },
    'documents.release': (p) => {
      const d = find('document', p.id);
      step('document', d.status, 'Released');
      Object.assign(d, { status: 'Released', releasedAt: now, checksum: d.checksum ?? hash(d.id + d.revision) }); check('document', d); touch(d);
      audit('document.release', { recordType: 'document', recordId: d.id });
      return d;
    },
    'documents.newRevision': (p, body) => {
      const prev = find('document', p.id);
      const input = parse(z.object({ file: z.any(), checksum: z.string().optional(), sizeBytes: z.number().int().optional() }), body);
      if (prev.status !== 'Released') throw new HttpError(409, 'invalid_transition', 'Only a Released document needs a new revision. Edit a draft directly.');
      const id = newId('doc');
      const cur: R = { ...structuredClone(prev), id, version: 1, createdAt: now, updatedAt: now, number: issue('D', { recordType: 'document', recordId: id }), revision: prev.revision + 1, status: 'Draft', supersedesId: prev.id, file: input.file, checksum: undefined, releasedAt: undefined, visibility: 'Private', sizeBytes: input.sizeBytes };
      prev.status = 'Superseded'; touch(prev);
      check('document', cur); ds.document.push(cur as never);
      return { previous: prev, current: cur };
    },
    'documents.setVisibility': (p, body) => {
      const d = find('document', p.id);
      const { visibility, publicInfo } = parse(z.object({ visibility: z.enum(['Private', 'Customer-shared', 'Public']), publicInfo: z.any().optional() }), body);
      const next = { ...d, visibility, publicInfo: publicInfo ?? d.publicInfo };
      check('document', next);
      Object.assign(d, { visibility, publicInfo: next.publicInfo }); touch(d);
      return d;
    },
    'milestones.invoice': (p, body) => {
      const m = find('milestone', p.id);
      const { dueDate } = parse(z.object({ dueDate: z.string() }), body);
      step('milestone', m.status, 'Invoiced');
      const proj = find('project', m.projectId);
      const id = newId('inv');
      const invoice: R = { id, version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'invoice', projectId: m.projectId, accountId: proj.accountId, invoiceNumber: `INV-${yy + 2000}-${String(ds.invoice.length + 14).padStart(3, '0')}`, lines: [{ description: `${m.name} (${m.percent}%)`, amountCents: m.amountCents, milestoneId: m.id }], amountCents: m.amountCents, dueDate, status: 'Draft' };
      check('invoice', invoice); ds.invoice.push(invoice as never);
      Object.assign(m, { status: 'Invoiced', invoiceId: id }); touch(m);
      return { milestone: m, invoice: view('invoice', invoice) };
    },
    'invoices.send': (p, body) => {
      const inv = find('invoice', p.id);
      const { issuedDate } = parse(z.object({ issuedDate: z.string().optional() }), body);
      step('invoice', inv.status, 'Sent');
      Object.assign(inv, { status: 'Sent', issuedDate: issuedDate ?? today }); check('invoice', inv); touch(inv);
      return view('invoice', inv);
    },
    'invoices.markPaid': (p, body) => {
      const inv = find('invoice', p.id);
      const { paidDate } = parse(z.object({ paidDate: z.string() }), body);
      step('invoice', inv.status, 'Paid');
      Object.assign(inv, { status: 'Paid', paidDate }); check('invoice', inv); touch(inv);
      for (const l of inv.lines as R[]) if (l.milestoneId) { const m = find('milestone', l.milestoneId); m.status = 'Paid'; touch(m); }
      return view('invoice', inv);
    },
    'scheduleItems.move': (p, body) => {
      const item = find('scheduleItem', p.id);
      const input = parse(MoveInput, body);
      const before = { start: item.start, end: item.end };
      const next = { ...item, start: input.start, end: input.end };
      check('scheduleItem', next);
      Object.assign(item, { start: input.start, end: input.end }); touch(item);
      const update = note({ recordType: 'scheduleItem', recordId: item.id }, 'date_change', `Dates moved from ${before.start}..${before.end} to ${input.start}..${input.end}.`, { reason: input.reason });
      return { scheduleItem: item, update };
    },
    'shareLinks.create': (_p, body) => {
      const input = parse(z.object({ projectId: z.string(), scope: z.any(), documentIds: z.array(z.string()), expiresAt: z.string() }), body);
      find('project', input.projectId);
      return makeLink(input);
    },
    'shareLinks.revoke': (p) => { const l = find('shareLink', p.id); l.revoked = true; touch(l); return l; },
    'registry.void': (p, body) => {
      const r = find('registry', p.id);
      const { reason } = parse(z.object({ reason: z.string().min(1) }), body);
      if (ds.opportunity.concat(ds.project as never, ds.document as never, ds.lead as never).some((x) => (x as R).number === r.number)) throw new HttpError(409, 'conflict', 'That number is in use. Void it only if no record carries it.');
      Object.assign(r, { status: 'Void', voidReason: reason }); touch(r);
      return r;
    },
    search: (_p, _b, q) => {
      const text = (q.get('q') ?? '').toLowerCase().trim();
      if (!text) return { hits: [] };
      const types = q.get('types')?.split(',');
      const hits: R[] = [];
      for (const key of Object.keys(schemas) as (keyof Dataset)[]) {
        if (['audit', 'registry', 'activity'].includes(key) || (types && !types.includes(key))) continue;
        for (const r of list(key)) {
          const blob = JSON.stringify(r).toLowerCase();
          const at = blob.indexOf(text);
          if (at < 0) continue;
          hits.push({ recordType: key, recordId: r.id, number: r.number, title: r.title ?? r.name ?? r.invoiceNumber ?? r.description ?? r.id, snippet: blob.slice(Math.max(0, at - 30), at + 60) });
        }
      }
      return { hits: hits.slice(0, 25) };
    },
    today: () => computeToday(ds, today),
    'assistant.ask': (_p, body) => {
      const input = parse(AssistantAskInput, body);
      const words = input.question.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      const scored: { r: R; key: string; score: number }[] = [];
      for (const key of ['opportunity', 'project', 'account', 'document', 'knowledgeItem', 'invoice'] as (keyof Dataset)[]) {
        for (const r of list(key)) {
          const blob = JSON.stringify(r).toLowerCase();
          const score = words.filter((w) => blob.includes(w)).length;
          if (score) scored.push({ r, key, score });
        }
      }
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, 3);
      const citations = top.map(({ r, key }) => ({ recordType: key, recordId: r.id, title: r.title ?? r.name ?? r.invoiceNumber, snippet: String(r.scopeSummary ?? r.body ?? r.message ?? r.title ?? '').slice(0, 120) }));
      return {
        answer: top.length ? `Mock answer. The closest records are ${citations.map((c) => c.title).join('; ')}.` : 'Mock answer. No records matched that question.',
        citations,
        usage: { inputTokens: 0, outputTokens: 0, costCents: 0, monthToDateCents: 0, monthlyCapCents: 2000 },
      };
    },
  };

  function makeLink(input: R) {
    for (const did of (input.documentIds ?? []) as string[]) {
      const d = find('document', did);
      if (d.visibility !== 'Customer-shared' || d.status !== 'Released') throw bad(`Document ${d.number} is not Released and Customer-shared, so it cannot be put on a customer link.`);
      if (d.linked.recordType !== 'project' || d.linked.recordId !== input.projectId) throw bad(`Document ${d.number} does not belong to this project.`);
    }
    if (input.scope?.type === 'upload' && find('checklistItem', input.scope.checklistItemId).projectId !== input.projectId) throw bad('That checklist item belongs to another project.');
    const id = newId('sl');
    const link: R = { id, version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'shareLink', projectId: input.projectId, scope: input.scope, documentIds: input.documentIds ?? [], expiresAt: input.expiresAt, revoked: false };
    check('shareLink', link); ds.shareLink.push(link as never);
    const token = `tok_${randomBytes(18).toString('base64url')}`;
    tokens.set(hash(token), id);
    return { shareLink: link, token, url: `/hub/p/${token}` };
  }

  // ---- Hub -------------------------------------------------------------------------------------------------------
  const linkFor = (token: string): R => {
    const id = tokens.get(hash(token));
    const link = id ? list('shareLink').find((l) => l.id === id) : undefined;
    if (!link) throw new HttpError(404, 'not_found', 'This link does not exist.');
    if (link.revoked) throw new HttpError(410, 'revoked', 'This link has been revoked.');
    if (link.expiresAt <= now) throw new HttpError(410, 'expired', 'This link has expired.');
    link.lastUsedAt = now;
    return link;
  };
  const shared = (link: R) => list('document').filter((d) => {
    const proj = d.linked.recordType === 'project' && d.linked.recordId === link.projectId;
    return proj && d.visibility === 'Customer-shared' && d.status === 'Released' && (link.documentIds.length === 0 || link.documentIds.includes(d.id));
  });
  const libEntries = () => list('document').filter((d) => d.visibility === 'Public' && d.status === 'Released' && d.publicInfo).map((d) => {
    const chain: R[] = [d]; let cur = d;
    while (cur.supersedesId) { cur = find('document', cur.supersedesId); chain.push(cur); }
    return { id: d.id, tab: d.publicInfo.tab, item: d.publicInfo.item, title: d.title, description: d.publicInfo.description, whenToUse: d.publicInfo.whenToUse, revision: d.revision, revisions: chain.slice(0, 3).map((c) => ({ revision: c.revision, releasedAt: c.releasedAt })), downloadPath: `/hub/api/library/${d.id}/file` };
  });

  const hubRoutes: Record<string, (p: R, body: unknown, q: URLSearchParams, req: http.IncomingMessage, raw: Buffer) => unknown> = {
    'hub.contact': (_p, body) => {
      const s = parse(ContactSubmission, body);
      const id = newId('lead');
      const lead: R = { id, version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'lead', number: issue('D', { recordType: 'lead', recordId: id }), source: 'contact_form', name: s.name || 'Unknown', company: s.company, email: s.email, phone: s.phone, message: s.message, sourceContext: s.sourceContext, receivedAt: now, status: 'New' };
      check('lead', lead); ds.lead.push(lead as never);
      note({ recordType: 'lead', recordId: id }, 'system', 'Lead created from the Contact form.', { actor: 'system' });
      return { received: true };
    },
    'hub.library': () => ({ entries: libEntries() }),
    'hub.libraryEntry': (p) => { const e = libEntries().find((x) => x.id === p.id); if (!e) throw missing('That entry'); return e; },
    'hub.sharePage': (p) => {
      const link = linkFor(p.token);
      const proj = find('project', link.projectId);
      const groups = new Map<string, R>();
      for (const d of shared(link)) {
        const key = `${d.location?.folder ?? 'Documents'}|${d.location?.subfolder ?? ''}`;
        const g = groups.get(key) ?? { folder: d.location?.folder ?? 'Documents', subfolder: d.location?.subfolder, documents: [] };
        g.documents.push({ id: d.id, title: d.title, kind: d.kind, revision: d.revision, sizeBytes: d.sizeBytes, downloadPath: `/hub/p/${p.token}/files/${d.id}` });
        groups.set(key, g);
      }
      const slots = link.scope.type === 'upload' ? [find('checklistItem', link.scope.checklistItemId)].filter((c) => c.status === 'Requested').map((c) => ({ checklistItemId: c.id, name: c.name, folder: c.location.folder })) : [];
      return { projectName: proj.title, reference: null, expiresAt: link.expiresAt, folders: [...groups.values()], uploadSlots: slots };
    },
    'hub.shareUpload': (p, _b, _q, req, raw) => {
      const link = linkFor(p.token);
      if (link.scope.type !== 'upload' || link.scope.checklistItemId !== p.checklistItemId) throw new HttpError(403, 'forbidden', 'This link does not allow that upload.');
      const item = find('checklistItem', p.checklistItemId);
      if (item.status !== 'Requested') throw new HttpError(409, 'invalid_transition', 'That item is not waiting for a file.');
      const fileName = decodeURIComponent(String(req.headers['x-file-name'] ?? 'upload.bin'));
      const id = newId('doc');
      const doc: R = { id, version: 1, createdAt: now, updatedAt: now, archived: false, tags: [], type: 'document', number: issue('D', { recordType: 'document', recordId: id }), title: fileName, kind: 'Other', linked: { recordType: 'project', recordId: link.projectId }, location: item.location, file: { storage: 'r2', key: `uploads/${id}` }, sizeBytes: raw.length, checksum: createHash('sha256').update(raw).digest('hex'), revision: 1, status: 'In review', visibility: 'Private' };
      check('document', doc); ds.document.push(doc as never);
      item.documentIds = [...item.documentIds, id]; item.status = 'Received'; touch(item);
      note({ recordType: 'checklistItem', recordId: item.id }, 'system', `Customer uploaded ${fileName}.`, { actor: 'share_link' });
      return { received: true, checklistItemId: item.id };
    },
  };
  const pdf = (title: string) => Buffer.from(`%PDF-1.4\n% mock file: ${title}\n`);

  // ---- routing -----------------------------------------------------------------------------------------------------
  const send = (res: http.ServerResponse, status: number, body: unknown, type = 'application/json') => {
    res.writeHead(status, { 'content-type': type, 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS' });
    res.end(type === 'application/json' ? JSON.stringify(body) : (body as Buffer));
  };
  const readBody = (req: http.IncomingMessage) => new Promise<Buffer>((resolve) => { const c: Buffer[] = []; req.on('data', (d: Buffer) => c.push(d)); req.on('end', () => resolve(Buffer.concat(c))); });

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') return send(res, 204, {});
      const u = new URL(req.url ?? '/', 'http://x');
      const raw = await readBody(req);
      const isJson = String(req.headers['content-type'] ?? '').includes('json');
      const body = isJson && raw.length ? JSON.parse(raw.toString()) : undefined;
      const path = u.pathname;
      const m = req.method ?? 'GET';

      // Hub routes
      if (path.startsWith('/hub/')) {
        let hit: [string, R] | undefined;
        const match = (pattern: string, name: string) => {
          const names: string[] = [];
          const re = new RegExp('^' + pattern.replace(/:([a-zA-Z]+)/g, (_, n) => { names.push(n); return '([^/]+)'; }) + '$');
          const mm = path.match(re);
          if (mm) hit = [name, Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(mm[i + 1]!)]))];
        };
        if (m === 'POST') { match('/hub/api/contact', 'hub.contact'); match('/hub/p/:token/uploads/:checklistItemId', 'hub.shareUpload'); }
        if (m === 'GET') {
          match('/hub/api/library', 'hub.library'); match('/hub/api/library/:id', 'hub.libraryEntry'); match('/hub/p/:token', 'hub.sharePage');
          let mm = path.match(/^\/hub\/api\/library\/([^/]+)\/file$/);
          if (mm) { const d = find('document', mm[1]!); if (d.visibility !== 'Public' || d.status !== 'Released') throw missing('That file'); return send(res, 200, pdf(d.title), 'application/pdf'); }
          mm = path.match(/^\/hub\/p\/([^/]+)\/files\/([^/]+)$/);
          if (mm) { const link = linkFor(mm[1]!); const d = shared(link).find((x) => x.id === mm![2]); if (!d) throw missing('That file'); return send(res, 200, pdf(d.title), 'application/pdf'); }
        }
        if (!hit) throw missing('That page');
        return send(res, 200, hubRoutes[hit[0]]!(hit[1], body, u.searchParams, req, raw));
      }

      if (!path.startsWith(API_BASE + '/')) throw missing('That route');
      const rest = path.slice(API_BASE.length);
      const seg = rest.split('/').filter(Boolean).map(decodeURIComponent);

      // Actions with explicit paths.
      const actionTable: [string, string, string][] = [
        ['POST', 'leads/:id/qualify', 'leads.qualify'], ['POST', 'leads/:id/status', 'leads.setStatus'],
        ['POST', 'opportunities/:id/win', 'opportunities.win'], ['POST', 'opportunities/:id/lose', 'opportunities.lose'], ['POST', 'opportunities/:id/reopen', 'opportunities.reopen'],
        ['POST', 'projects/:id/stage', 'projects.setStage'], ['POST', 'projects/:id/baselines', 'projects.createBaseline'],
        ['POST', 'checklist-items/:id/status', 'checklistItems.setStatus'], ['POST', 'checklist-items/:id/request', 'checklistItems.requestUpload'],
        ['POST', 'documents/:id/release', 'documents.release'], ['POST', 'documents/:id/revisions', 'documents.newRevision'], ['POST', 'documents/:id/visibility', 'documents.setVisibility'],
        ['POST', 'milestones/:id/invoice', 'milestones.invoice'], ['POST', 'invoices/:id/send', 'invoices.send'], ['POST', 'invoices/:id/paid', 'invoices.markPaid'],
        ['POST', 'schedule-items/:id/move', 'scheduleItems.move'], ['POST', 'share-links', 'shareLinks.create'], ['POST', 'share-links/:id/revoke', 'shareLinks.revoke'],
        ['POST', 'registry/:id/void', 'registry.void'], ['GET', 'search', 'search'], ['GET', 'today', 'today'], ['POST', 'assistant/ask', 'assistant.ask'],
      ];
      for (const [method, pattern, name] of actionTable) {
        if (method !== m) continue;
        const ps = pattern.split('/');
        if (ps.length !== seg.length) continue;
        const params: R = {};
        if (!ps.every((s, i) => (s.startsWith(':') ? ((params[s.slice(1)] = seg[i]), true) : s === seg[i]))) continue;
        const status = name === 'shareLinks.create' || name === 'checklistItems.requestUpload' ? 201 : 200;
        return send(res, status, actions[name]!(params, body, u.searchParams, req));
      }

      // Record CRUD.
      const key = keyOfPath(seg[0] ?? '');
      if (!key) throw missing('That route');
      const cfg = resources[key];
      if (seg.length === 1 && m === 'GET') return send(res, 200, listRecords(key, u.searchParams));
      if (seg.length === 1 && m === 'POST' && cfg.create) return send(res, 201, createRecord(key, body));
      if (seg.length === 2 && m === 'GET') return send(res, 200, view(key, find(key, seg[1]!)));
      if (seg.length === 2 && m === 'PATCH' && cfg.update) return send(res, 200, updateRecord(key, seg[1]!, body));
      throw new HttpError(405, 'forbidden', 'That method is not allowed here.');
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: { code: e.code, message: e.message, fields: e.fields } });
      return send(res, 500, { error: { code: 'validation_failed', message: e instanceof Error ? e.message : 'Unexpected error' } });
    }
  });

  return new Promise((resolve) => {
    server.listen(opts.port ?? 0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({ url: `http://localhost:${port}`, ds, close: () => new Promise((r) => server.close(() => r())) });
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const s = await startMock({ port: Number(process.env.PORT ?? 8787) });
  console.log(`Mock API on ${s.url}${API_BASE}  (Hub routes under ${s.url}/hub). Fixture date ${FIXTURE_TODAY}.`);
}

/**
 * The Vault's business logic, written once against a Store. Every route in the contract is handled here.
 * `createApp` returns a standard fetch handler (runs on Workers and in Node) and the narrow interface the Hub may use.
 */
import { z } from 'zod';
import {
  API_BASE, AssistantAskInput, ContactSubmission, LoseInput, MoveInput, ProjectStructureDefinition, QualifyInput, WinInput,
  canTransition, computeToday, createInputSchema, daysLate, emptyDataset, invoiceDisplayStatus, numberDigits, numberedTypes,
  projectCompleteness, recordRefFields, recordRuleIssues, refRules, resources, schemas, updateInputSchema,
} from '@bc/contract';
import { AssistantAnswer as AssistantAnswerSchema } from '@bc/contract';
import type { Dataset, ResourceKey, SharePage, VaultPublicApi } from '@bc/contract';
import { badRequest, conflict, forbidden, HttpError, notFound } from './errors.ts';
import type { FileStore } from './files.ts';
import { Tx } from './store.ts';
import type { Store } from './store.ts';
import { addDays, dateIn, MAX_UPLOAD_BYTES, newId, newToken, readAll, sha256Hex } from './util.ts';
import type { Rec } from './util.ts';

export interface Assistant {
  ask(input: z.infer<typeof AssistantAskInput>, store: Store): Promise<z.infer<typeof AssistantAnswerSchema>>;
}

export interface AppDeps {
  store: Store;
  files: FileStore;
  /** Current time as an ISO string. Injected so tests can move time. */
  clock: () => string;
  timeZone?: string;
  /** Returns the signed-in person, or null. When omitted every request is allowed (mock and local development only). */
  authenticate?: (req: Request) => Promise<{ email: string } | null>;
  assistant?: Assistant;
}

interface Ctx { now: string; today: string; yy: number; tx(): Tx; email?: string }
class Created {
  body: unknown;
  constructor(body: unknown) { this.body = body; }
}
type Handler = (c: Ctx, p: Record<string, string>, body: any, q: URLSearchParams, req: Request) => Promise<unknown>; // eslint-disable-line @typescript-eslint/no-explicit-any

const STATE_MACHINE_OF: Record<string, Parameters<typeof canTransition>[0]> = {
  lead: 'lead', opportunity: 'opportunity', project: 'project', checklistItem: 'checklistItem', document: 'document',
  invoice: 'invoice', milestone: 'milestone', job: 'job', sourcingItem: 'sourcingItem',
};
/** Types whose state changes only happen through an action route. */
const ACTION_ONLY = new Set(['lead', 'opportunity', 'project', 'checklistItem', 'document', 'invoice', 'milestone']);

export function createApp(deps: AppDeps) {
  const { store, files } = deps;
  const tz = deps.timeZone ?? 'America/Chicago';
  const base = (c: Ctx) => ({ version: 1, createdAt: c.now, updatedAt: c.now, archived: false, tags: [] as string[] });
  const context = (email?: string): Ctx => {
    const now = deps.clock();
    const today = dateIn(tz, now);
    const c: Ctx = { now, today, yy: Number(today.slice(2, 4)), email, tx: () => new Tx(store, now, Number(today.slice(2, 4)), newId) };
    return c;
  };

  // ---- helpers ---------------------------------------------------------------------------------------------------
  const must = async (type: string, id: string): Promise<Rec> => {
    const r = await store.get(type, id);
    if (!r) throw notFound(`${type} "${id}"`);
    return r;
  };
  const parse = <T extends z.ZodType>(schema: T, body: unknown): z.infer<T> => {
    const p = schema.safeParse(body ?? {});
    if (!p.success) throw badRequest('The request is not valid.', Object.fromEntries(p.error.issues.map((i) => [i.path.join('.') || '_', i.message])));
    return p.data;
  };
  const step = (type: string, from: string, to: string) => {
    const m = STATE_MACHINE_OF[type];
    if (m && !canTransition(m, from, to)) throw new HttpError(409, 'invalid_transition', `A ${type} cannot move from ${from} to ${to}.`);
  };
  const audit = (tx: Tx, c: Ctx, action: string, about: { recordType: string; recordId: string }, before?: unknown, after?: unknown, actor = 'grant') => {
    tx.insert('audit', { id: newId('aud'), ...base(c), type: 'audit', actor, action, about, before, after, at: c.now });
  };
  const note = (tx: Tx, c: Ctx, about: { recordType: string; recordId: string }, kind: string, text: string, extra: Rec = {}) => {
    const a = { id: newId('act'), ...base(c), type: 'activity', about, kind, text, actor: 'grant', at: c.now, ...extra };
    tx.insert('activity', a);
    return a;
  };
  const assertRefs = async (type: string, rec: Rec) => {
    for (const rule of refRules.filter((r) => r.from === type)) {
      const raw = rec[rule.field];
      const ids: string[] = rule.many ? raw ?? [] : raw == null ? [] : [raw];
      const targets = Array.isArray(rule.to) ? rule.to : [rule.to as string];
      for (const id of ids) {
        let ok = false;
        for (const t of targets) if (await store.get(t, id)) { ok = true; break; }
        if (!ok) throw badRequest(`${rule.field}: "${id}" does not exist.`, { [rule.field]: 'does not exist' });
      }
    }
    for (const f of recordRefFields.filter((x) => x.from === type)) {
      const ref = rec[f.field];
      if (ref && !(await store.get(ref.recordType, ref.recordId))) throw badRequest(`${f.field}: ${ref.recordType} "${ref.recordId}" does not exist.`, { [f.field]: 'does not exist' });
    }
  };
  /** Full check of a record about to be written: schema, rules between fields, and links. */
  const validate = async (type: string, rec: Rec) => {
    const parsed = (schemas[type as keyof typeof schemas] as z.ZodType).safeParse(rec);
    if (!parsed.success) throw badRequest('The record is not valid.', Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.') || '_', i.message])));
    const rules = recordRuleIssues(rec as never);
    if (rules.length) throw badRequest(rules.join(' '));
    await assertRefs(type, rec);
  };
  const view = async (type: string, rec: Rec, c: Ctx): Promise<Rec> => {
    if (type === 'project') return { ...rec, completeness: projectCompleteness((await store.list('checklistItem', { filters: { projectId: rec.id } })) as never) };
    if (type === 'invoice') {
      const d = invoiceDisplayStatus(rec as never, c.today);
      return { ...rec, displayStatus: d, daysLate: d === 'Overdue' ? daysLate(rec as never, c.today) : 0 };
    }
    return rec;
  };
  const loadDataset = async (types: (keyof Dataset)[]): Promise<Dataset> => {
    const ds = emptyDataset() as Record<string, Rec[]>;
    for (const t of types) ds[t] = await store.list(t as string);
    return ds as unknown as Dataset;
  };

  // ---- generic records -------------------------------------------------------------------------------------------
  const listRecords = async (key: ResourceKey, q: URLSearchParams, c: Ctx) => {
    const filters: Record<string, string> = {};
    for (const [f, v] of q) if (!['q', 'limit', 'cursor', 'archived', 'types'].includes(f)) filters[f] = v;
    const rows = await store.list(key, { filters, q: q.get('q') ?? undefined, includeArchived: q.get('archived') === 'true', limit: Number(q.get('limit') ?? 200) });
    return { items: await Promise.all(rows.map((r) => view(key, r, c))), nextCursor: null };
  };

  const createRecord = async (key: ResourceKey, body: unknown, c: Ctx) => {
    const input = parse(createInputSchema(key), body) as Rec;
    const rec: Rec = { id: newId(key), ...base(c), ...input, type: key };
    const tx = c.tx();
    const numType = (numberedTypes as Rec)[key];
    if (numType) rec.number = await tx.issue(numType, { recordType: key, recordId: rec.id });
    if (key === 'activity') { rec.at = c.now; rec.actor = 'grant'; }
    await validate(key, rec);
    tx.insert(key, rec);
    audit(tx, c, `${key}.create`, { recordType: key, recordId: rec.id }, undefined, rec);
    await tx.commit();
    return view(key, rec, c);
  };

  const updateRecord = async (key: ResourceKey, id: string, body: unknown, c: Ctx) => {
    const rec = await must(key, id);
    const input = parse(updateInputSchema(key), body) as Rec;
    if (input.version !== rec.version) throw conflict('This record changed since you loaded it. Reload and try again.');
    if (key === 'document' && (rec.status === 'Released' || rec.status === 'Superseded')) throw new HttpError(409, 'locked', 'A Released document is locked. Create a new revision instead.');
    const { version: _v, ...changes } = input;
    for (const f of ['status', 'stage']) {
      if (changes[f] !== undefined && changes[f] !== rec[f]) {
        if (ACTION_ONLY.has(key)) throw new HttpError(409, 'invalid_transition', `Change the ${f} of a ${key} with its action, not by editing it.`);
        step(key, rec[f], changes[f]);
      }
    }
    const before = structuredClone(rec);
    const next = { ...rec, ...changes };
    await validate(key, next);
    const tx = c.tx();
    tx.update(key, next);
    audit(tx, c, `${key}.update`, { recordType: key, recordId: id }, before, next);
    await tx.commit();
    return view(key, next, c);
  };

  // ---- share links -----------------------------------------------------------------------------------------------
  const makeLink = async (c: Ctx, tx: Tx, input: Rec) => {
    await must('project', input.projectId);
    for (const did of (input.documentIds ?? []) as string[]) {
      const d = await must('document', did);
      if (d.visibility !== 'Customer-shared' || d.status !== 'Released') throw badRequest(`Document ${d.number} is not Released and Customer-shared, so it cannot be put on a customer link.`);
      if (d.linked.recordType !== 'project' || d.linked.recordId !== input.projectId) throw badRequest(`Document ${d.number} does not belong to this project.`);
    }
    if (input.scope?.type === 'upload') {
      const item = await must('checklistItem', input.scope.checklistItemId);
      if (item.projectId !== input.projectId) throw badRequest('That checklist item belongs to another project.');
    }
    const id = newId('sl');
    const link: Rec = { id, ...base(c), type: 'shareLink', projectId: input.projectId, scope: input.scope, documentIds: input.documentIds ?? [], expiresAt: input.expiresAt, revoked: false };
    await validate('shareLink', link);
    const token = newToken();
    tx.insert('shareLink', link);
    tx.putToken(await sha256Hex(token), id);
    audit(tx, c, 'shareLink.create', { recordType: 'shareLink', recordId: id }, undefined, { projectId: input.projectId, scope: input.scope, expiresAt: input.expiresAt });
    return { shareLink: link, token, url: `/hub/p/${token}` };
  };

  const sharedDocs = async (link: Rec): Promise<Rec[]> => {
    const docs = await store.list('document');
    return docs.filter((d) => d.linked.recordType === 'project' && d.linked.recordId === link.projectId && d.visibility === 'Customer-shared' && d.status === 'Released' && (link.documentIds.length === 0 || link.documentIds.includes(d.id)));
  };

  // ---- actions ---------------------------------------------------------------------------------------------------
  const actions: Record<string, Handler> = {
    'leads.qualify': async (c, p, body) => {
      const lead = await must('lead', p.id!);
      const input = parse(QualifyInput, body);
      step('lead', lead.status, 'Qualified');
      const tx = c.tx();
      let account: Rec;
      if (input.accountId) account = await must('account', input.accountId);
      else {
        account = { id: newId('acc'), ...base(c), type: 'account', ...input.newAccount };
        await validate('account', account); tx.insert('account', account);
      }
      let contact: Rec | undefined;
      if (input.contactId) contact = await must('contact', input.contactId);
      else if (input.newContact) {
        contact = { id: newId('con'), ...base(c), type: 'contact', accountId: account.id, primary: true, ...input.newContact };
        await validate('contact', contact); tx.insert('contact', contact);
      }
      const oid = newId('opp');
      const opportunity: Rec = {
        id: oid, ...base(c), type: 'opportunity', number: await tx.issue('Q', { recordType: 'opportunity', recordId: oid }),
        accountId: account.id, contactId: contact?.id, title: input.opportunityTitle, scopeSummary: input.scopeSummary,
        estimatedValueCents: input.estimatedValueCents, sourceLeadId: lead.id, status: 'Open', quoteDocumentIds: [],
      };
      // The account and contact are in this transaction but not stored yet, so link checks use the opportunity's own fields.
      const parsed = schemas.opportunity.safeParse(opportunity);
      if (!parsed.success) throw badRequest('The opportunity is not valid.', Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
      tx.insert('opportunity', opportunity);
      const updated = { ...lead, status: 'Qualified', accountId: account.id, opportunityId: oid };
      tx.update('lead', updated);
      note(tx, c, { recordType: 'lead', recordId: lead.id }, 'state_change', `Qualified. Opportunity ${opportunity.number} created.`, { actor: 'system' });
      audit(tx, c, 'lead.qualify', { recordType: 'lead', recordId: lead.id }, undefined, { opportunityId: oid });
      await tx.commit();
      return { lead: updated, account, contact, opportunity };
    },
    'leads.setStatus': async (c, p, body) => {
      const lead = await must('lead', p.id!);
      const { status } = parse(z.object({ status: z.enum(['Contacted', 'Dismissed', 'New']) }), body);
      step('lead', lead.status, status);
      const next = { ...lead, status };
      const tx = c.tx(); tx.update('lead', next); audit(tx, c, 'lead.setStatus', { recordType: 'lead', recordId: lead.id }, { status: lead.status }, { status });
      await tx.commit();
      return next;
    },
    'opportunities.win': async (c, p, body) => {
      const opp = await must('opportunity', p.id!);
      const input = parse(WinInput, body);
      step('opportunity', opp.status, 'Won');
      const tpl = await must('template', input.templateId);
      const def = ProjectStructureDefinition.safeParse(tpl.definition);
      if (!def.success) throw badRequest('That template is not a project structure.');
      const D = def.data;
      const tx = c.tx();
      const pid = newId('proj');
      const project: Rec = {
        id: pid, ...base(c), type: 'project', number: await tx.issue('B', { recordType: 'project', recordId: pid }, `BC-B-${numberDigits(opp.number)}`),
        accountId: opp.accountId, opportunityId: opp.id, title: opp.title, contractValueCents: input.contractValueCents ?? opp.estimatedValueCents,
        stage: 'Design', templateId: tpl.id, cgmp: input.cgmp, onshapeUrls: [],
      };
      const item = (location: Rec, name: string, required: boolean): Rec => ({ id: newId('ci'), ...base(c), type: 'checklistItem', projectId: pid, location, name, required, status: 'Missing', documentIds: [] });
      const checklistItems = D.checklist.map((x) => item(x.location, x.name, x.required));
      if (input.cgmp) {
        const cg = (await store.list('template')).find((t) => t.cgmpOption);
        for (const x of ((cg?.definition as Rec | undefined)?.checklist ?? []) as { name: string; required: boolean }[]) checklistItems.push(item({ folder: 'Documentation - Project', subfolder: 'cGMP Package' }, x.name, x.required));
      }
      const jobs: Rec[] = [];
      for (const j of D.jobs) {
        const jid = newId('job');
        jobs.push({ id: jid, ...base(c), type: 'job', number: await tx.issue('J', { recordType: 'job', recordId: jid }), projectId: pid, category: j.category, description: j.description, status: 'Not started' });
      }
      const total = project.contractValueCents as number;
      let allocated = 0;
      const milestones = D.milestones.map((m, i) => {
        const amount = i === D.milestones.length - 1 ? total - allocated : Math.round((total * m.percent) / 100);
        allocated += amount;
        return { id: newId('ms'), ...base(c), type: 'milestone', projectId: pid, name: m.name, percent: m.percent, amountCents: amount, dueDate: addDays(c.today, 30 * (i + 1)), status: 'Pending' };
      });
      const scheduleItems: Rec[] = [];
      D.schedule.forEach((s, i) => {
        const dep = s.dependsOnIndex != null ? scheduleItems[s.dependsOnIndex] : undefined;
        const start = dep ? addDays(dep.end, 1) : c.today;
        scheduleItems.push({ id: newId('si'), ...base(c), type: 'scheduleItem', projectId: pid, name: s.name, category: s.category, start, end: addDays(start, s.durationDays - 1), dependsOn: dep ? [dep.id] : [], percentComplete: 0, sortOrder: i + 1 });
      });
      const wonOpp = { ...opp, status: 'Won', decidedDate: c.today, projectId: pid };
      for (const [t, rows] of [['project', [project]], ['checklistItem', checklistItems], ['job', jobs], ['milestone', milestones], ['scheduleItem', scheduleItems]] as [string, Rec[]][]) {
        for (const r of rows) {
          const parsed = (schemas[t as keyof typeof schemas] as z.ZodType).safeParse(r);
          if (!parsed.success) throw badRequest(`The new ${t} is not valid.`, Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
          tx.insert(t, r);
        }
      }
      const oppRules = recordRuleIssues(wonOpp as never);
      if (oppRules.length) throw badRequest(oppRules.join(' '));
      tx.update('opportunity', wonOpp);
      note(tx, c, { recordType: 'opportunity', recordId: opp.id }, 'state_change', `Won. Project ${project.number} activated from "${tpl.name}".`, { actor: 'system' });
      audit(tx, c, 'opportunity.win', { recordType: 'opportunity', recordId: opp.id }, undefined, { projectId: pid });
      await tx.commit();
      return { opportunity: wonOpp, project, checklistItems, jobs, milestones, scheduleItems };
    },
    'opportunities.lose': async (c, p, body) => {
      const opp = await must('opportunity', p.id!);
      const { reason } = parse(LoseInput, body);
      step('opportunity', opp.status, 'Lost');
      const next = { ...opp, status: 'Lost', lostReason: reason, decidedDate: c.today };
      await validate('opportunity', next);
      const tx = c.tx(); tx.update('opportunity', next); audit(tx, c, 'opportunity.lose', { recordType: 'opportunity', recordId: opp.id }, undefined, { reason });
      await tx.commit();
      return next;
    },
    'opportunities.reopen': async (c, p) => {
      const opp = await must('opportunity', p.id!);
      step('opportunity', opp.status, 'Open');
      const next: Rec = { ...opp, status: 'Open' }; delete next.lostReason; delete next.decidedDate;
      const tx = c.tx(); tx.update('opportunity', next); audit(tx, c, 'opportunity.reopen', { recordType: 'opportunity', recordId: opp.id });
      await tx.commit();
      return next;
    },
    'projects.setStage': async (c, p, body) => {
      const proj = await must('project', p.id!);
      const { stage } = parse(z.object({ stage: z.enum(['Design', 'Build', 'Install', 'Closed']) }), body);
      step('project', proj.stage, stage);
      const next = { ...proj, stage };
      const tx = c.tx(); tx.update('project', next);
      note(tx, c, { recordType: 'project', recordId: proj.id }, 'state_change', `Stage changed from ${proj.stage} to ${stage}.`, { actor: 'system' });
      audit(tx, c, 'project.setStage', { recordType: 'project', recordId: proj.id }, { stage: proj.stage }, { stage });
      await tx.commit();
      return view('project', next, c);
    },
    'projects.createBaseline': async (c, p, body) => {
      const proj = await must('project', p.id!);
      const { name } = parse(z.object({ name: z.string().min(1) }), body);
      const items = (await store.list('scheduleItem', { filters: { projectId: proj.id } })).map((s) => ({ scheduleItemId: s.id, start: s.start, end: s.end, percentComplete: s.percentComplete }));
      const b = { id: newId('bl'), ...base(c), type: 'baseline', projectId: proj.id, name, takenAt: c.now, items };
      await validate('baseline', b);
      const tx = c.tx(); tx.insert('baseline', b); audit(tx, c, 'baseline.create', { recordType: 'baseline', recordId: b.id }, undefined, { name, items: items.length });
      await tx.commit();
      return new Created(b);
    },
    'checklistItems.setStatus': async (c, p, body) => {
      const item = await must('checklistItem', p.id!);
      const input = parse(z.object({ status: z.enum(['Missing', 'Requested', 'Received', 'In review', 'Released']), documentId: z.string().optional() }), body);
      step('checklistItem', item.status, input.status);
      const next: Rec = { ...item, status: input.status };
      if (input.documentId) { await must('document', input.documentId); next.documentIds = [...new Set([...item.documentIds, input.documentId])]; }
      await validate('checklistItem', next);
      const tx = c.tx(); tx.update('checklistItem', next); audit(tx, c, 'checklistItem.setStatus', { recordType: 'checklistItem', recordId: item.id }, { status: item.status }, { status: input.status });
      await tx.commit();
      return next;
    },
    'checklistItems.requestUpload': async (c, p, body) => {
      const item = await must('checklistItem', p.id!);
      const { expiresAt } = parse(z.object({ expiresAt: z.string() }), body);
      if (item.status !== 'Missing' && item.status !== 'Requested') throw new HttpError(409, 'invalid_transition', `Item is already ${item.status}.`);
      const tx = c.tx();
      const next = { ...item, status: 'Requested' };
      tx.update('checklistItem', next);
      const result = await makeLink(c, tx, { projectId: item.projectId, scope: { type: 'upload', checklistItemId: item.id }, documentIds: [], expiresAt });
      await tx.commit();
      return new Created(result);
    },
    'documents.release': async (c, p) => {
      const d = await must('document', p.id!);
      step('document', d.status, 'Released');
      if (!d.file || d.file.key === 'pending') throw badRequest('Upload the file before releasing the document.');
      const next = { ...d, status: 'Released', releasedAt: c.now, checksum: d.checksum ?? (await sha256Hex(d.id + d.revision)) };
      await validate('document', next);
      const tx = c.tx(); tx.update('document', next); audit(tx, c, 'document.release', { recordType: 'document', recordId: d.id });
      await tx.commit();
      return next;
    },
    'documents.newRevision': async (c, p, body) => {
      const prev = await must('document', p.id!);
      const input = parse(z.object({ file: z.any(), checksum: z.string().optional(), sizeBytes: z.number().int().optional() }), body);
      if (prev.status !== 'Released') throw new HttpError(409, 'invalid_transition', 'Only a Released document needs a new revision. Edit a draft directly.');
      const tx = c.tx();
      const id = newId('doc');
      const cur: Rec = { ...structuredClone(prev), id, ...base(c), number: await tx.issue('D', { recordType: 'document', recordId: id }), revision: prev.revision + 1, status: 'Draft', supersedesId: prev.id, file: input.file, visibility: 'Private', sizeBytes: input.sizeBytes, checksum: input.checksum };
      delete cur.releasedAt; delete cur.publicInfo;
      if (!input.checksum) delete cur.checksum;
      await validate('document', cur);
      const old = { ...prev, status: 'Superseded' };
      tx.insert('document', cur); tx.update('document', old);
      audit(tx, c, 'document.newRevision', { recordType: 'document', recordId: id }, undefined, { supersedes: prev.id });
      await tx.commit();
      return new Created({ previous: old, current: cur });
    },
    'documents.setVisibility': async (c, p, body) => {
      const d = await must('document', p.id!);
      const { visibility, publicInfo } = parse(z.object({ visibility: z.enum(['Private', 'Customer-shared', 'Public']), publicInfo: z.any().optional() }), body);
      const next = { ...d, visibility, publicInfo: publicInfo ?? d.publicInfo };
      await validate('document', next);
      const tx = c.tx(); tx.update('document', next); audit(tx, c, 'document.setVisibility', { recordType: 'document', recordId: d.id }, { visibility: d.visibility }, { visibility });
      await tx.commit();
      return next;
    },
    'documents.upload': async (c, p, _b, _q, req) => {
      const d = await must('document', p.id!);
      if (d.status === 'Released' || d.status === 'Superseded') throw new HttpError(409, 'locked', 'A Released document is locked. Create a new revision instead.');
      if (!req.body) throw badRequest('Send the file as the request body.');
      let bytes: Uint8Array;
      try { bytes = await readAll(req.body, MAX_UPLOAD_BYTES); } catch { throw new HttpError(413, 'validation_failed', 'That file is larger than 25 MB.'); }
      if (bytes.length === 0) throw badRequest('The file is empty.');
      const checksum = await sha256Hex(bytes);
      const mimeType = req.headers.get('content-type')?.split(';')[0] || 'application/octet-stream';
      const key = `docs/${d.id}/r${d.revision}-${checksum.slice(0, 12)}`;
      await files.put(key, bytes, mimeType);
      const next = { ...d, file: { storage: 'r2', key }, sizeBytes: bytes.length, checksum, mimeType };
      const tx = c.tx(); tx.update('document', next); audit(tx, c, 'document.upload', { recordType: 'document', recordId: d.id }, undefined, { sizeBytes: bytes.length, checksum });
      await tx.commit();
      return next;
    },
    'documents.download': async (_c, p) => {
      const d = await must('document', p.id!);
      if (d.file.storage !== 'r2') throw notFound('A stored file (this document is a link: open it from its record)');
      const f = await files.get(d.file.key);
      if (!f) throw notFound('The file');
      return new Response(f.bytes as BodyInit, { headers: { 'content-type': f.mimeType ?? d.mimeType ?? 'application/octet-stream', 'content-disposition': `attachment; filename="${String(d.title).replace(/[^\w. -]/g, '_')}"`, 'cache-control': 'private, no-store' } });
    },
    'milestones.invoice': async (c, p, body) => {
      const m = await must('milestone', p.id!);
      const { dueDate } = parse(z.object({ dueDate: z.string() }), body);
      step('milestone', m.status, 'Invoiced');
      const proj = await must('project', m.projectId);
      const id = newId('inv');
      const count = (await store.list('invoice', { includeArchived: true })).length;
      const invoice: Rec = { id, ...base(c), type: 'invoice', projectId: m.projectId, accountId: proj.accountId, invoiceNumber: `INV-${2000 + c.yy}-${String(count + 15).padStart(3, '0')}`, lines: [{ description: `${m.name} (${m.percent}%)`, amountCents: m.amountCents, milestoneId: m.id }], amountCents: m.amountCents, dueDate, status: 'Draft' };
      const next = { ...m, status: 'Invoiced', invoiceId: id };
      const tx = c.tx();
      const parsed = schemas.invoice.safeParse(invoice);
      if (!parsed.success) throw badRequest('The invoice is not valid.', Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
      tx.insert('invoice', invoice); tx.update('milestone', next);
      audit(tx, c, 'milestone.invoice', { recordType: 'invoice', recordId: id }, undefined, { milestoneId: m.id });
      await tx.commit();
      return new Created({ milestone: next, invoice: await view('invoice', invoice, c) });
    },
    'invoices.send': async (c, p, body) => {
      const inv = await must('invoice', p.id!);
      const { issuedDate } = parse(z.object({ issuedDate: z.string().optional() }), body);
      step('invoice', inv.status, 'Sent');
      const next = { ...inv, status: 'Sent', issuedDate: issuedDate ?? c.today };
      await validate('invoice', next);
      const tx = c.tx(); tx.update('invoice', next); audit(tx, c, 'invoice.send', { recordType: 'invoice', recordId: inv.id });
      await tx.commit();
      return view('invoice', next, c);
    },
    'invoices.markPaid': async (c, p, body) => {
      const inv = await must('invoice', p.id!);
      const { paidDate } = parse(z.object({ paidDate: z.string() }), body);
      step('invoice', inv.status, 'Paid');
      const next = { ...inv, status: 'Paid', paidDate };
      await validate('invoice', next);
      const tx = c.tx(); tx.update('invoice', next);
      for (const l of inv.lines as Rec[]) if (l.milestoneId) { const m = await must('milestone', l.milestoneId); tx.update('milestone', { ...m, status: 'Paid' }); }
      audit(tx, c, 'invoice.markPaid', { recordType: 'invoice', recordId: inv.id });
      await tx.commit();
      return view('invoice', next, c);
    },
    'scheduleItems.move': async (c, p, body) => {
      const item = await must('scheduleItem', p.id!);
      const input = parse(MoveInput, body);
      const next = { ...item, start: input.start, end: input.end };
      await validate('scheduleItem', next);
      const tx = c.tx(); tx.update('scheduleItem', next);
      const update = note(tx, c, { recordType: 'scheduleItem', recordId: item.id }, 'date_change', `Dates moved from ${item.start}..${item.end} to ${input.start}..${input.end}.`, { reason: input.reason });
      audit(tx, c, 'scheduleItem.move', { recordType: 'scheduleItem', recordId: item.id }, { start: item.start, end: item.end }, { start: input.start, end: input.end });
      await tx.commit();
      return { scheduleItem: next, update };
    },
    'shareLinks.create': async (c, _p, body) => {
      const input = parse(z.object({ projectId: z.string(), scope: z.any(), documentIds: z.array(z.string()), expiresAt: z.string() }), body);
      const tx = c.tx();
      const result = await makeLink(c, tx, input);
      await tx.commit();
      return new Created(result);
    },
    'shareLinks.revoke': async (c, p) => {
      const l = await must('shareLink', p.id!);
      const next = { ...l, revoked: true };
      const tx = c.tx(); tx.update('shareLink', next); audit(tx, c, 'shareLink.revoke', { recordType: 'shareLink', recordId: l.id });
      await tx.commit();
      return next;
    },
    'registry.void': async (c, p, body) => {
      const r = await must('registry', p.id!);
      const { reason } = parse(z.object({ reason: z.string().min(1) }), body);
      for (const t of Object.keys(numberedTypes)) if ((await store.list(t, { includeArchived: true })).some((x) => x.number === r.number)) throw conflict('That number is in use. Void it only if no record carries it.');
      const next = { ...r, status: 'Void', voidReason: reason };
      const tx = c.tx(); tx.update('registry', next); audit(tx, c, 'registry.void', { recordType: 'registry', recordId: r.id }, undefined, { reason });
      await tx.commit();
      return next;
    },
    search: async (_c, _p, _b, q) => {
      const text = (q.get('q') ?? '').toLowerCase().trim();
      if (!text) return { hits: [] };
      const types = q.get('types')?.split(',');
      const hits: Rec[] = [];
      for (const key of Object.keys(schemas)) {
        if (['audit', 'registry', 'activity'].includes(key) || (types && !types.includes(key))) continue;
        for (const r of await store.list(key, { q: text })) {
          const blob = JSON.stringify(r).toLowerCase();
          const at = blob.indexOf(text);
          hits.push({ recordType: key, recordId: r.id, number: r.number, title: r.title ?? r.name ?? r.invoiceNumber ?? r.description ?? r.id, snippet: blob.slice(Math.max(0, at - 30), at + 60) });
        }
      }
      return { hits: hits.slice(0, 25) };
    },
    today: async (c) => computeToday(await loadDataset(['lead', 'opportunity', 'invoice', 'event', 'project', 'checklistItem']), c.today),
    'assistant.ask': async (_c, _p, body) => {
      const input = parse(AssistantAskInput, body);
      return (deps.assistant ?? keywordAssistant).ask(input, store);
    },
  };

  // ---- routing ---------------------------------------------------------------------------------------------------
  const actionTable: [string, string, string][] = [
    ['POST', 'leads/:id/qualify', 'leads.qualify'], ['POST', 'leads/:id/status', 'leads.setStatus'],
    ['POST', 'opportunities/:id/win', 'opportunities.win'], ['POST', 'opportunities/:id/lose', 'opportunities.lose'], ['POST', 'opportunities/:id/reopen', 'opportunities.reopen'],
    ['POST', 'projects/:id/stage', 'projects.setStage'], ['POST', 'projects/:id/baselines', 'projects.createBaseline'],
    ['POST', 'checklist-items/:id/status', 'checklistItems.setStatus'], ['POST', 'checklist-items/:id/request', 'checklistItems.requestUpload'],
    ['POST', 'documents/:id/release', 'documents.release'], ['POST', 'documents/:id/revisions', 'documents.newRevision'], ['POST', 'documents/:id/visibility', 'documents.setVisibility'],
    ['PUT', 'documents/:id/file', 'documents.upload'], ['GET', 'documents/:id/file', 'documents.download'],
    ['POST', 'milestones/:id/invoice', 'milestones.invoice'], ['POST', 'invoices/:id/send', 'invoices.send'], ['POST', 'invoices/:id/paid', 'invoices.markPaid'],
    ['POST', 'schedule-items/:id/move', 'scheduleItems.move'], ['POST', 'share-links', 'shareLinks.create'], ['POST', 'share-links/:id/revoke', 'shareLinks.revoke'],
    ['POST', 'registry/:id/void', 'registry.void'], ['GET', 'search', 'search'], ['GET', 'today', 'today'], ['POST', 'assistant/ask', 'assistant.ask'],
  ];
  const keyOfPath = (p: string) => Object.entries(resources).find(([, v]) => v.path === p)?.[0] as ResourceKey | undefined;

  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  const fail = (e: HttpError) => json(e.status, { error: { code: e.code, message: e.message, fields: e.fields } });

  async function handle(req: Request): Promise<Response> {
    try {
      const u = new URL(req.url);
      if (!u.pathname.startsWith(API_BASE + '/')) throw notFound('That route');
      const rest = u.pathname.slice(API_BASE.length);
      if (rest === '/health' && req.method === 'GET') return json(200, { ok: true, time: deps.clock() });
      let email: string | undefined;
      if (deps.authenticate) {
        const who = await deps.authenticate(req);
        if (!who) throw new HttpError(401, 'unauthorized', 'Sign in to use the Vault.');
        email = who.email;
      }
      const c = context(email);
      const seg = rest.split('/').filter(Boolean).map(decodeURIComponent);
      const m = req.method;
      const readBody = async () => (req.headers.get('content-type')?.includes('json') ? await req.json().catch(() => { throw badRequest('The request body is not valid JSON.'); }) : undefined);

      for (const [method, pattern, name] of actionTable) {
        if (method !== m) continue;
        const ps = pattern.split('/');
        if (ps.length !== seg.length) continue;
        const params: Record<string, string> = {};
        if (!ps.every((s, i) => (s.startsWith(':') ? ((params[s.slice(1)] = seg[i]!), true) : s === seg[i]))) continue;
        const body = name === 'documents.upload' ? undefined : await readBody();
        const out = await actions[name]!(c, params, body, u.searchParams, req);
        if (out instanceof Response) return out;
        return json(out instanceof Created ? 201 : 200, out instanceof Created ? out.body : out);
      }
      const key = keyOfPath(seg[0] ?? '');
      if (!key) throw notFound('That route');
      const cfg = resources[key];
      if (seg.length === 1 && m === 'GET') return json(200, await listRecords(key, u.searchParams, c));
      if (seg.length === 1 && m === 'POST' && cfg.create) return json(201, await createRecord(key, await readBody(), c));
      if (seg.length === 2 && m === 'GET') return json(200, await view(key, await must(key, seg[1]!), c));
      if (seg.length === 2 && m === 'PATCH' && cfg.update) return json(200, await updateRecord(key, seg[1]!, await readBody(), c));
      throw new HttpError(405, 'forbidden', 'That method is not allowed here.');
    } catch (e) {
      if (e instanceof HttpError) return fail(e);
      console.error('Unhandled error', e);
      return json(500, { error: { code: 'validation_failed', message: 'Something went wrong on the server. Try again.' } });
    }
  }

  // ---- the narrow interface the Hub may use --------------------------------------------------------------------------
  const linkFor = async (tokenHash: string, c: Ctx): Promise<Rec> => {
    const id = await store.tokenLink(tokenHash);
    const link = id ? await store.get('shareLink', id) : undefined;
    if (!link) throw new HttpError(404, 'not_found', 'This link does not exist.');
    if (link.revoked) throw new HttpError(410, 'revoked', 'This link has been revoked.');
    if (link.expiresAt <= c.now) throw new HttpError(410, 'expired', 'This link has expired.');
    return link;
  };
  const touchLink = async (link: Rec, c: Ctx) => { const tx = c.tx(); tx.update('shareLink', { ...link, lastUsedAt: c.now }); await tx.commit(); };
  const libEntries = async () => {
    const docs = await store.list('document');
    const byId = new Map(docs.map((d) => [d.id, d]));
    return docs.filter((d) => d.visibility === 'Public' && d.status === 'Released' && d.publicInfo).map((d) => {
      const chain: Rec[] = [d]; let cur = d;
      while (cur.supersedesId && byId.get(cur.supersedesId)) { cur = byId.get(cur.supersedesId)!; chain.push(cur); }
      return { id: d.id, tab: d.publicInfo.tab, item: d.publicInfo.item, title: d.title, description: d.publicInfo.description, whenToUse: d.publicInfo.whenToUse, revision: d.revision, revisions: chain.slice(0, 3).map((x) => ({ revision: x.revision, releasedAt: x.releasedAt })), downloadPath: `/hub/api/library/${d.id}/file` };
    });
  };
  const asErr = (e: unknown) => { if (e instanceof HttpError && (e.code === 'expired' || e.code === 'revoked' || e.code === 'not_found')) return { error: e.code as 'expired' | 'revoked' | 'not_found' }; throw e; };

  const publicApi: VaultPublicApi = {
    async submitContact(input) {
      const s = ContactSubmission.parse(input);
      const c = context();
      const tx = c.tx();
      const id = newId('lead');
      const lead: Rec = { id, ...base(c), type: 'lead', number: await tx.issue('D', { recordType: 'lead', recordId: id }), source: 'contact_form', name: s.name || 'Unknown', company: s.company, email: s.email, phone: s.phone, message: s.message, sourceContext: s.sourceContext, receivedAt: c.now, status: 'New' };
      if (s.attachment) {
        const bytes = Uint8Array.from(atob(s.attachment.contentBase64), (ch) => ch.charCodeAt(0));
        if (bytes.length > MAX_UPLOAD_BYTES) throw badRequest('That file is larger than 25 MB.');
        const did = newId('doc'), checksum = await sha256Hex(bytes), key = `uploads/${did}`;
        await files.put(key, bytes, s.attachment.mimeType);
        tx.insert('document', { id: did, ...base(c), type: 'document', number: await tx.issue('D', { recordType: 'document', recordId: did }), title: s.attachment.fileName, kind: 'Other', linked: { recordType: 'lead', recordId: id }, file: { storage: 'r2', key }, mimeType: s.attachment.mimeType, sizeBytes: bytes.length, checksum, revision: 1, status: 'In review', visibility: 'Private' });
        lead.attachmentDocumentId = did;
      }
      await validate('lead', lead);
      tx.insert('lead', lead);
      note(tx, c, { recordType: 'lead', recordId: id }, 'system', 'Lead created from the Contact form.', { actor: 'system' });
      await tx.commit();
      return { received: true };
    },
    async listLibrary() { return { entries: await libEntries() }; },
    async getLibraryEntry(id) { return (await libEntries()).find((e) => e.id === id) ?? null; },
    async getSharePage(tokenHash) {
      const c = context();
      try {
        const link = await linkFor(tokenHash, c);
        const proj = await must('project', link.projectId);
        const groups = new Map<string, Rec>();
        for (const d of await sharedDocs(link)) {
          const key = `${d.location?.folder ?? 'Documents'}|${d.location?.subfolder ?? ''}`;
          const g = groups.get(key) ?? { folder: d.location?.folder ?? 'Documents', subfolder: d.location?.subfolder, documents: [] };
          g.documents.push({ id: d.id, title: d.title, kind: d.kind, revision: d.revision, sizeBytes: d.sizeBytes, downloadPath: `/hub/p/{token}/files/${d.id}` });
          groups.set(key, g);
        }
        const slots: Rec[] = [];
        if (link.scope.type === 'upload') {
          const item = await store.get('checklistItem', link.scope.checklistItemId);
          if (item?.status === 'Requested') slots.push({ checklistItemId: item.id, name: item.name, folder: item.location.folder });
        }
        await touchLink(link, c);
        return { projectName: proj.title, reference: null, expiresAt: link.expiresAt, folders: [...groups.values()], uploadSlots: slots } as unknown as SharePage;
      } catch (e) { return asErr(e); }
    },
    async readDocument(scope, documentId) {
      const c = context();
      const d = await store.get('document', documentId);
      if (!d) return null;
      if ('library' in scope) { if (d.visibility !== 'Public' || d.status !== 'Released') return null; }
      else {
        let link: Rec;
        try { link = await linkFor(scope.tokenHash, c); } catch { return null; }
        if (!(await sharedDocs(link)).some((x) => x.id === d.id)) return null;
      }
      if (d.file.storage !== 'r2') return null;
      const f = await files.get(d.file.key);
      if (!f) return null;
      return { fileName: d.title, mimeType: f.mimeType ?? d.mimeType ?? 'application/octet-stream', body: new Response(f.bytes as BodyInit).body! };
    },
    async acceptUpload(tokenHash, checklistItemId, file) {
      const c = context();
      let link: Rec;
      try { link = await linkFor(tokenHash, c); } catch (e) { return asErr(e); }
      if (link.scope.type !== 'upload' || link.scope.checklistItemId !== checklistItemId) throw forbidden('This link does not allow that upload.');
      const item = await must('checklistItem', checklistItemId);
      if (item.status !== 'Requested') throw new HttpError(409, 'invalid_transition', 'That item is not waiting for a file.');
      let bytes: Uint8Array;
      try { bytes = await readAll(file.body, MAX_UPLOAD_BYTES); } catch { throw new HttpError(413, 'validation_failed', 'That file is larger than 25 MB.'); }
      if (bytes.length === 0) throw badRequest('The file is empty.');
      const tx = c.tx();
      const did = newId('doc'), checksum = await sha256Hex(bytes), key = `uploads/${did}`;
      await files.put(key, bytes, file.mimeType);
      const doc: Rec = { id: did, ...base(c), type: 'document', number: await tx.issue('D', { recordType: 'document', recordId: did }), title: file.fileName, kind: 'Other', linked: { recordType: 'project', recordId: link.projectId }, location: item.location, file: { storage: 'r2', key }, mimeType: file.mimeType, sizeBytes: bytes.length, checksum, revision: 1, status: 'In review', visibility: 'Private' };
      await validate('document', doc);
      tx.insert('document', doc);
      tx.update('checklistItem', { ...item, documentIds: [...item.documentIds, did], status: 'Received' });
      note(tx, c, { recordType: 'checklistItem', recordId: item.id }, 'system', `Customer uploaded ${file.fileName}.`, { actor: 'share_link' });
      audit(tx, c, 'checklistItem.customerUpload', { recordType: 'checklistItem', recordId: item.id }, undefined, { documentId: did }, 'share_link');
      await tx.commit();
      return { received: true as const, checklistItemId: item.id };
    },
  };

  return { handle, publicApi };
}

/** A stand-in for the Claude-backed assistant (track C4): matches words and cites the records it found. */
export const keywordAssistant: Assistant = {
  async ask(input, store) {
    const words = input.question.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const scored: { r: Rec; key: string; score: number }[] = [];
    for (const key of ['opportunity', 'project', 'account', 'document', 'knowledgeItem', 'invoice']) {
      for (const r of await store.list(key)) {
        const blob = JSON.stringify(r).toLowerCase();
        const score = words.filter((w) => blob.includes(w)).length;
        if (score) scored.push({ r, key, score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 3);
    const citations = top.map(({ r, key }) => ({ recordType: key as never, recordId: r.id as string, title: String(r.title ?? r.name ?? r.invoiceNumber), snippet: String(r.scopeSummary ?? r.body ?? r.message ?? r.title ?? '').slice(0, 120) }));
    return {
      answer: top.length ? `Mock answer. The closest records are ${citations.map((c) => c.title).join('; ')}.` : 'Mock answer. No records matched that question.',
      citations,
      usage: { inputTokens: 0, outputTokens: 0, costCents: 0, monthToDateCents: 0, monthlyCapCents: 2000 },
    };
  },
};

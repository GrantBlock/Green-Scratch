/**
 * The Assistant's tools. All of them only read. Whatever a tool returns is wrapped so the model treats it as data: records hold text
 * written by customers, suppliers and web pages, and none of it is an instruction.
 */
import { computeToday, daysBetween, daysLate, emptyDataset, invoiceDisplayStatus, projectCompleteness } from '@bc/contract';
import type { Dataset } from '@bc/contract';
import type { Store } from '@bc/core';
import type { ToolSpec } from './model.ts';

type Rec = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** What the Assistant may read. Audit events, the Registry and share links are internal and never offered. */
export const READABLE_TYPES = [
  'lead', 'account', 'contact', 'opportunity', 'project', 'checklistItem', 'job', 'milestone', 'po', 'invoice', 'event', 'trip',
  'scheduleItem', 'baseline', 'sourcingItem', 'expense', 'document', 'knowledgeItem', 'template',
] as const;
const READABLE = new Set<string>(READABLE_TYPES);

export const MAX_RESULT_CHARS = 12_000;

export interface Seen { recordType: string; recordId: string; title: string; snippet: string }
export interface ToolCtx { store: Store; today: string; seen: Map<string, Seen> }

const typeEnum = { type: 'string', enum: [...READABLE_TYPES] };

export const TOOLS: ToolSpec[] = [
  {
    name: 'search_records',
    description: 'Find records whose text contains the words. Use for "what do we know about X", names, part numbers, topics. Returns short rows; use get_record for the full record.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words to look for. One distinctive word works best.' },
        types: { type: 'array', items: typeEnum, description: 'Limit to these record types. Omit to search them all.' },
        limit: { type: 'integer', description: 'Most rows to return (1 to 15). Default 8.' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_record',
    description: 'Get one record in full by its type and id.',
    input_schema: { type: 'object', properties: { type: typeEnum, id: { type: 'string' } }, required: ['type', 'id'], additionalProperties: false },
  },
  {
    name: 'list_records',
    description: 'List records of one type, optionally filtered by exact field values (for example status "Open", projectId, accountId). Returns short rows.',
    input_schema: {
      type: 'object',
      properties: {
        type: typeEnum,
        filters: { type: 'object', description: 'Field name to exact value, for example {"status": "Open"}.', additionalProperties: { type: 'string' } },
        limit: { type: 'integer', description: 'Most rows to return (1 to 40). Default 25.' },
      },
      required: ['type'],
      additionalProperties: false,
    },
  },
  {
    name: 'project_overview',
    description: 'One call that gathers a project: its checklist by folder with completeness, schedule with slip against the latest baseline, milestones, invoices and days late, sourcing, expenses, and recent updates. Prefer this for any question about one project.',
    input_schema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'], additionalProperties: false },
  },
  {
    name: 'get_updates',
    description: 'Get the notes and changes recorded on one record, newest first.',
    input_schema: { type: 'object', properties: { recordType: typeEnum, recordId: { type: 'string' }, limit: { type: 'integer', description: 'Default 15.' } }, required: ['recordType', 'recordId'], additionalProperties: false },
  },
  {
    name: 'today_summary',
    description: 'What needs attention today: new leads, follow-ups due, overdue invoices, visits this week, missing documents.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

// ---- helpers -------------------------------------------------------------------------------------------------------

const clean = (r: Rec): Rec => {
  const { version: _v, createdAt: _c, updatedAt: _u, archived, tags, checksum: _s, ...rest } = r;
  const out: Rec = { ...rest };
  if (archived) out.archived = true;
  if (tags?.length) out.tags = tags;
  if (out.file) out.file = { storage: out.file.storage };
  return out;
};

const titleOf = (r: Rec) => [r.number, r.title ?? r.name ?? r.invoiceNumber ?? r.description ?? r.poNumber ?? r.id].filter(Boolean).join(' ');
const snippetOf = (r: Rec) => {
  const own = r.scopeSummary ?? r.body ?? r.message ?? r.text ?? r.purpose ?? r.description;
  const hint = own ?? (r.lines?.[0] ? `${r.lines[0].description}, due ${r.dueDate}, ${r.status}` : r.status && r.name ? `${r.name} (${r.status})` : r.kind && r.start ? `${r.kind}, ${r.start}` : r.start && r.end ? `${r.start} to ${r.end}` : r.title ?? r.name ?? '');
  return String(hint).replace(/\s+/g, ' ').slice(0, 120);
};

/** Make a record unable to close the tag it is wrapped in or open another. */
const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');

function remember(ctx: ToolCtx, type: string, r: Rec) {
  ctx.seen.set(`${type}:${r.id}`, { recordType: type, recordId: r.id, title: titleOf(r), snippet: snippetOf(r) });
}

const wrap = (type: string, r: Rec) => `<record type="${type}" id="${String(r.id).replace(/[^\w.-]/g, '_')}">${safeJson(clean(r))}</record>`;

function limitText(s: string): string {
  return s.length <= MAX_RESULT_CHARS ? s : `${s.slice(0, MAX_RESULT_CHARS)}\n[Cut off at ${MAX_RESULT_CHARS} characters. Ask for less, or filter.]`;
}

const dollars = (cents: number | undefined) => (cents == null ? undefined : `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

/** A short row for lists and search results. */
async function row(ctx: ToolCtx, type: string, r: Rec, accounts?: Map<string, string>): Promise<Rec> {
  const base: Rec = { type, id: r.id, ...(r.number ? { number: r.number } : {}), title: titleOf(r).replace(`${r.number ?? ''} `, '') };
  const pick = (...keys: string[]) => { for (const k of keys) if (r[k] !== undefined && r[k] !== null && r[k] !== '') base[k] = r[k]; };
  switch (type) {
    case 'opportunity': pick('status', 'nextAction', 'nextActionDue', 'lostReason'); base.value = dollars(r.estimatedValueCents); base.account = accounts?.get(r.accountId); break;
    case 'project': pick('stage', 'targetEnd', 'cgmp'); base.value = dollars(r.contractValueCents); base.account = accounts?.get(r.accountId); break;
    case 'lead': pick('status', 'company', 'receivedAt'); break;
    case 'invoice': {
      const d = invoiceDisplayStatus(r as never, ctx.today);
      base.amount = dollars(r.amountCents); base.status = d; pick('dueDate', 'projectId');
      if (d === 'Overdue') base.daysLate = daysLate(r as never, ctx.today);
      break;
    }
    case 'milestone': pick('status', 'dueDate', 'projectId'); base.amount = dollars(r.amountCents); break;
    case 'checklistItem': pick('status', 'required', 'projectId', 'dueDate'); base.folder = r.location?.folder; break;
    case 'document': pick('kind', 'status', 'visibility', 'revision'); break;
    case 'scheduleItem': pick('category', 'start', 'end', 'percentComplete', 'projectId'); break;
    case 'event': pick('kind', 'start', 'location'); break;
    case 'account': pick('kind', 'clientCode'); break;
    case 'knowledgeItem': pick('kind', 'scope'); break;
    default: pick('status', 'kind', 'projectId', 'accountId');
  }
  base.snippet = snippetOf(r);
  remember(ctx, type, r);
  return base;
}

async function accountNames(store: Store): Promise<Map<string, string>> {
  return new Map((await store.list('account')).map((a) => [a.id, a.name]));
}

// ---- executors -----------------------------------------------------------------------------------------------------

type Args = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const readable = (t: unknown): string => {
  if (typeof t !== 'string' || !READABLE.has(t)) throw new ToolError(`"${String(t)}" is not a record type you can read. Use one of: ${READABLE_TYPES.join(', ')}.`);
  return t;
};
export class ToolError extends Error {}

export async function runTool(name: string, args: Args, ctx: ToolCtx): Promise<string> {
  switch (name) {
    case 'search_records': {
      const query = String(args.query ?? '').trim();
      if (!query) throw new ToolError('Give some words to search for.');
      const types: string[] = Array.isArray(args.types) && args.types.length ? args.types.map(readable) : [...READABLE_TYPES];
      const limit = Math.min(15, Math.max(1, Number(args.limit) || 8));
      const accounts = await accountNames(ctx.store);
      const rows: Rec[] = [];
      for (const t of types) for (const r of await ctx.store.list(t, { q: query, limit })) { if (rows.length < limit) rows.push(await row(ctx, t, r, accounts)); }
      return limitText(rows.length ? `<results count="${rows.length}">${safeJson(rows)}</results>` : `No records contain "${query}".`);
    }
    case 'get_record': {
      const t = readable(args.type);
      const r = await ctx.store.get(t, String(args.id));
      if (!r) throw new ToolError(`There is no ${t} with id "${String(args.id)}".`);
      remember(ctx, t, r);
      return limitText(wrap(t, r));
    }
    case 'list_records': {
      const t = readable(args.type);
      const filters: Record<string, string> = {};
      for (const [k, v] of Object.entries((args.filters ?? {}) as Record<string, unknown>)) filters[k] = String(v);
      const limit = Math.min(40, Math.max(1, Number(args.limit) || 25));
      const accounts = await accountNames(ctx.store);
      const rows: Rec[] = [];
      for (const r of await ctx.store.list(t, { filters, limit })) rows.push(await row(ctx, t, r, accounts));
      return limitText(`<results type="${t}" count="${rows.length}">${safeJson(rows)}</results>`);
    }
    case 'project_overview': return limitText(await projectOverview(String(args.projectId), ctx));
    case 'get_updates': {
      const t = readable(args.recordType);
      const id = String(args.recordId);
      const limit = Math.min(40, Math.max(1, Number(args.limit) || 15));
      const all = (await ctx.store.list('activity')).filter((a) => a.about.recordType === t && a.about.recordId === id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
      for (const a of all) remember(ctx, 'activity', a);
      return limitText(all.length ? `<updates about="${t}:${id.replace(/[^\w.-]/g, '_')}">${safeJson(all.map((a) => ({ id: a.id, at: a.at, kind: a.kind, actor: a.actor, text: a.text, reason: a.reason })))}</updates>` : `No updates are recorded on ${t} ${id}.`);
    }
    case 'today_summary': {
      const ds = emptyDataset() as Record<string, Rec[]>;
      for (const t of ['lead', 'opportunity', 'invoice', 'event', 'project', 'checklistItem']) ds[t] = await ctx.store.list(t);
      const today = computeToday(ds as unknown as Dataset, ctx.today);
      const out = {
        today: today.today,
        newLeads: await Promise.all(today.newLeads.map((r) => row(ctx, 'lead', r))),
        followUpsDue: await Promise.all(today.followUpsDue.map((r) => row(ctx, 'opportunity', r, undefined))),
        overdueInvoices: await Promise.all(today.overdueInvoices.map((x) => row(ctx, 'invoice', x.invoice))),
        visits: await Promise.all(today.visits.map((r) => row(ctx, 'event', r))),
        missingDocuments: await Promise.all(today.missingDocuments.map((m) => row(ctx, 'checklistItem', m.item))),
      };
      return limitText(`<today>${safeJson(out)}</today>`);
    }
    default: throw new ToolError(`There is no tool called "${name}".`);
  }
}

async function projectOverview(projectId: string, ctx: ToolCtx): Promise<string> {
  const p = await ctx.store.get('project', projectId);
  if (!p) throw new ToolError(`There is no project with id "${projectId}".`);
  const f = { projectId };
  const [account, checklist, schedule, baselines, milestones, invoices, pos, sourcing, expenses, jobs, activity] = await Promise.all([
    ctx.store.get('account', p.accountId), ctx.store.list('checklistItem', { filters: f }), ctx.store.list('scheduleItem', { filters: f }),
    ctx.store.list('baseline', { filters: f }), ctx.store.list('milestone', { filters: f }), ctx.store.list('invoice', { filters: f }),
    ctx.store.list('po', { filters: f }), ctx.store.list('sourcingItem', { filters: f }), ctx.store.list('expense', { filters: f }),
    ctx.store.list('job', { filters: f }), ctx.store.list('activity'),
  ]);
  remember(ctx, 'project', p);

  const folders: Record<string, Rec[]> = {};
  for (const c of checklist) {
    remember(ctx, 'checklistItem', c);
    const key = `${c.location.folder}${c.location.subfolder ? ` / ${c.location.subfolder}` : ''}`;
    (folders[key] ??= []).push({ id: c.id, name: c.name, required: c.required, status: c.status, ...(c.dueDate ? { dueDate: c.dueDate } : {}) });
  }
  const latest = [...baselines].sort((a, b) => b.takenAt.localeCompare(a.takenAt))[0];
  const was = new Map<string, Rec>((latest?.items ?? []).map((i: Rec) => [i.scheduleItemId, i]));
  const sched = [...schedule].sort((a, b) => a.sortOrder - b.sortOrder).map((s) => {
    remember(ctx, 'scheduleItem', s);
    const b = was.get(s.id);
    return { id: s.id, name: s.name, category: s.category, start: s.start, end: s.end, percentComplete: s.percentComplete, ...(b ? { baselineEnd: b.end, slipDays: daysBetween(b.end, s.end) } : {}) };
  });
  const inv = invoices.map((i) => {
    remember(ctx, 'invoice', i);
    const d = invoiceDisplayStatus(i as never, ctx.today);
    return { id: i.id, invoiceNumber: i.invoiceNumber, amount: dollars(i.amountCents), dueDate: i.dueDate, status: d, ...(d === 'Overdue' ? { daysLate: daysLate(i as never, ctx.today) } : {}) };
  });
  for (const m of milestones) remember(ctx, 'milestone', m);
  for (const s of sourcing) remember(ctx, 'sourcingItem', s);
  const ids = new Set([projectId, ...schedule.map((s) => s.id), ...checklist.map((c) => c.id)]);
  const updates = activity.filter((a) => ids.has(a.about.recordId)).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10).map((a) => ({ at: a.at, about: `${a.about.recordType}:${a.about.recordId}`, kind: a.kind, text: a.text, ...(a.reason ? { reason: a.reason } : {}) }));
  const spent = expenses.reduce((s, e) => s + e.amountCents, 0);

  const overview = {
    project: { id: p.id, number: p.number, title: p.title, stage: p.stage, account: account?.name, contractValue: dollars(p.contractValueCents), targetEnd: p.targetEnd, cgmp: p.cgmp },
    completenessPercent: projectCompleteness(checklist as never),
    checklistByFolder: folders,
    schedule: { latestBaseline: latest ? { name: latest.name, takenAt: latest.takenAt } : null, items: sched },
    jobs: jobs.map((j) => ({ number: j.number, category: j.category, description: j.description, status: j.status })),
    milestones: milestones.map((m) => ({ id: m.id, name: m.name, percent: m.percent, amount: dollars(m.amountCents), dueDate: m.dueDate, status: m.status })),
    invoices: inv,
    purchaseOrders: pos.map((o) => ({ poNumber: o.poNumber, amount: dollars(o.amountCents), date: o.date })),
    sourcing: sourcing.map((s) => ({ id: s.id, description: s.description, status: s.status, price: dollars(s.priceCents), leadTimeDays: s.leadTimeDays })),
    expensesTotal: dollars(spent),
    recentUpdates: updates,
  };
  return `<project_overview id="${String(p.id).replace(/[^\w.-]/g, '_')}">${safeJson(overview)}</project_overview>`;
}

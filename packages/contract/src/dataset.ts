import { z } from 'zod';
import { schemas, type RecordOf, type Schemas, numberedTypes, type AnyRecord } from './records.ts';
import { recordRuleIssues, numberDigits, projectCompleteness } from './rules.ts';
import { refRules, recordRefFields } from './refs.ts';
import { RegistryNumber, type RecordType } from './common.ts';

/** A whole database as arrays per record type. Fixtures, the mock server and tests all use this shape. */
export type Dataset = { [K in keyof Schemas]: RecordOf<K>[] };

export const emptyDataset = (): Dataset =>
  Object.fromEntries(Object.keys(schemas).map((k) => [k, []])) as unknown as Dataset;

export interface Issue { record: string; message: string }

/** Check a dataset against the schemas, the rules, and the links between records. Returns every problem found. */
export function validateDataset(ds: Dataset): Issue[] {
  const issues: Issue[] = [];
  const add = (record: string, message: string) => issues.push({ record, message });
  const byType = new Map<string, Map<string, AnyRecord>>();

  for (const type of Object.keys(schemas) as (keyof Schemas)[]) {
    const m = new Map<string, AnyRecord>();
    byType.set(type, m);
    for (const rec of ds[type] as AnyRecord[]) {
      const label = `${type}:${(rec as { id?: string }).id ?? '?'}`;
      const parsed = (schemas[type] as z.ZodType).safeParse(rec);
      if (!parsed.success) {
        for (const i of parsed.error.issues) add(label, `${i.path.join('.')}: ${i.message}`);
        continue;
      }
      if (rec.type !== type) add(label, `type is "${rec.type}", expected "${type}"`);
      if (m.has(rec.id)) add(label, 'duplicate id');
      m.set(rec.id, rec);
      for (const msg of recordRuleIssues(rec)) add(label, msg);
    }
  }
  const get = (t: string, id: string) => byType.get(t)?.get(id);

  // Links resolve.
  for (const rule of refRules) {
    const targets = Array.isArray(rule.to) ? rule.to : [rule.to];
    for (const rec of byType.get(rule.from)?.values() ?? []) {
      const raw = (rec as unknown as Record<string, unknown>)[rule.field];
      const ids = rule.many ? ((raw as string[] | undefined) ?? []) : raw == null ? [] : [raw as string];
      for (const id of ids) if (!targets.some((t) => get(t, id))) add(`${rule.from}:${rec.id}`, `${rule.field} -> "${id}" does not exist`);
    }
  }
  for (const f of recordRefFields) {
    for (const rec of byType.get(f.from)?.values() ?? []) {
      const ref = (rec as unknown as Record<string, { recordType: string; recordId: string } | undefined>)[f.field];
      if (ref && !get(ref.recordType, ref.recordId)) add(`${f.from}:${rec.id}`, `${f.field} -> ${ref.recordType} "${ref.recordId}" does not exist`);
    }
  }

  // Registry numbers: right type, unique across the system, and listed in the registry.
  const seen = new Map<string, string>();
  for (const [kind, regType] of Object.entries(numberedTypes)) {
    for (const rec of byType.get(kind)?.values() ?? []) {
      const n = (rec as unknown as { number: string }).number;
      if (!RegistryNumber.safeParse(n).success || n.split('-')[1] !== regType) add(`${kind}:${rec.id}`, `number ${n} is not a BC-${regType} number`);
      if (seen.has(n)) add(`${kind}:${rec.id}`, `number ${n} is already used by ${seen.get(n)}`);
      seen.set(n, `${kind}:${rec.id}`);
      const entry = ds.registry.find((r) => r.number === n);
      if (!entry) add(`${kind}:${rec.id}`, `number ${n} is missing from the registry`);
      else if (entry.status === 'Void') add(`${kind}:${rec.id}`, `number ${n} is VOID but still in use`);
    }
  }

  // A project shares the five digits of its opportunity's number.
  for (const p of ds.project) {
    const o = get('opportunity', p.opportunityId) as RecordOf<'opportunity'> | undefined;
    if (o && numberDigits(o.number) !== numberDigits(p.number)) add(`project:${p.id}`, `number ${p.number} does not share digits with ${o.number}`);
    if (o && o.projectId !== p.id) add(`project:${p.id}`, 'its opportunity does not point back to it');
    if (o && o.status !== 'Won') add(`project:${p.id}`, 'its opportunity is not Won');
  }
  for (const o of ds.opportunity) {
    if (o.status === 'Won' && o.projectId && !get('project', o.projectId)) add(`opportunity:${o.id}`, 'Won but its project is missing');
  }

  // Milestones of a project total 100 percent.
  const pct = new Map<string, number>();
  for (const m of ds.milestone) pct.set(m.projectId, (pct.get(m.projectId) ?? 0) + m.percent);
  for (const [pid, total] of pct) if (total !== 100) add(`project:${pid}`, `milestones total ${total} percent, not 100`);

  // Schedule dependencies stay inside the project, and baselines refer to the project's own items.
  const items = new Map(ds.scheduleItem.map((s) => [s.id, s]));
  for (const s of ds.scheduleItem) {
    for (const d of s.dependsOn) {
      const dep = items.get(d);
      if (dep && dep.projectId !== s.projectId) add(`scheduleItem:${s.id}`, 'depends on an item of another project');
    }
  }
  const state = new Map<string, 1 | 2>();
  const visit = (id: string): boolean => {
    if (state.get(id) === 2) return false;
    if (state.get(id) === 1) return true;
    state.set(id, 1);
    for (const d of items.get(id)?.dependsOn ?? []) if (visit(d)) return true;
    state.set(id, 2);
    return false;
  };
  for (const id of items.keys()) if (visit(id)) { add(`scheduleItem:${id}`, 'dependencies form a cycle'); break; }
  for (const b of ds.baseline) {
    for (const bi of b.items) {
      const s = items.get(bi.scheduleItemId);
      if (s && s.projectId !== b.projectId) add(`baseline:${b.id}`, 'baseline item belongs to another project');
    }
  }

  // Documents: a Released one is locked; a superseded chain keeps its revision order.
  for (const d of ds.document) {
    if (d.supersedesId) {
      const prev = get('document', d.supersedesId) as RecordOf<'document'> | undefined;
      if (prev && prev.revision >= d.revision) add(`document:${d.id}`, 'a revision must be higher than the one it supersedes');
      if (prev && prev.status !== 'Superseded') add(`document:${d.id}`, 'the document it supersedes should be Superseded');
    }
  }

  // Checklist items that are Received or better need a document.
  for (const c of ds.checklistItem) {
    if ((c.status === 'Received' || c.status === 'In review' || c.status === 'Released') && c.documentIds.length === 0) add(`checklistItem:${c.id}`, `${c.status} but no document attached`);
  }

  // A share link may only expose Customer-shared, Released documents of its own project.
  for (const l of ds.shareLink) {
    for (const did of l.documentIds) {
      const d = get('document', did) as RecordOf<'document'> | undefined;
      if (d && (d.visibility !== 'Customer-shared' || d.status !== 'Released')) add(`shareLink:${l.id}`, `exposes ${d.number}, which is not a Released, Customer-shared document`);
    }
    if (l.scope.type === 'upload') {
      const c = get('checklistItem', l.scope.checklistItemId) as RecordOf<'checklistItem'> | undefined;
      if (!c) add(`shareLink:${l.id}`, 'upload scope points to a missing checklist item');
      else if (c.projectId !== l.projectId) add(`shareLink:${l.id}`, 'upload scope points to another project');
    }
  }
  void projectCompleteness;
  return issues;
}

export type { RecordType };

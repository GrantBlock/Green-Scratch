import type { AnyRecord, ChecklistItem, Invoice } from './records.ts';
import { ASSISTANT_CONTEXT_KINDS } from './records.ts';
import { NEVER_SHARED_FOLDERS } from './common.ts';

/** Invoice "Overdue" is derived, not stored: a Sent invoice past its due date. */
export function invoiceDisplayStatus(inv: Pick<Invoice, 'status' | 'dueDate'>, today: string): 'Draft' | 'Sent' | 'Overdue' | 'Paid' {
  if (inv.status === 'Sent' && inv.dueDate < today) return 'Overdue';
  return inv.status;
}

export function daysBetween(fromDate: string, toDate: string): number {
  const a = Date.UTC(+fromDate.slice(0, 4), +fromDate.slice(5, 7) - 1, +fromDate.slice(8, 10));
  const b = Date.UTC(+toDate.slice(0, 4), +toDate.slice(5, 7) - 1, +toDate.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

export function daysLate(inv: Pick<Invoice, 'dueDate'>, today: string): number {
  return Math.max(0, daysBetween(inv.dueDate, today));
}

/** Percent (0 to 100) of required checklist items at Received or better. No required items means 100. */
export function projectCompleteness(items: readonly Pick<ChecklistItem, 'required' | 'status'>[]): number {
  const required = items.filter((i) => i.required);
  if (required.length === 0) return 100;
  const done = required.filter((i) => i.status === 'Received' || i.status === 'In review' || i.status === 'Released').length;
  return Math.round((done / required.length) * 100);
}

/** The five digits (YYNNN) of a Registry number. */
export function numberDigits(n: string): string {
  return n.slice(-5);
}

export function formatNumber(type: string, yy: number, seq: number): string {
  return `BC-${type}-${String(yy).padStart(2, '0')}${String(seq).padStart(3, '0')}`;
}

/** Cross-field rules for a single record. Returns plain-language problems; empty means valid. */
export function recordRuleIssues(rec: AnyRecord): string[] {
  const out: string[] = [];
  switch (rec.type) {
    case 'lead':
      if (rec.status === 'Qualified' && !(rec.opportunityId && rec.accountId)) out.push('A Qualified lead needs an account and an opportunity.');
      break;
    case 'opportunity':
      if (rec.status === 'Lost' && !rec.lostReason?.trim()) out.push('A Lost opportunity needs a reason.');
      if (rec.status === 'Won' && !rec.projectId) out.push('A Won opportunity needs its project.');
      if (rec.status !== 'Open' && !rec.decidedDate) out.push('A decided opportunity needs a decided date.');
      if (rec.status === 'Open' && rec.lostReason) out.push('An Open opportunity cannot have a lost reason.');
      break;
    case 'invoice': {
      const sum = rec.lines.reduce((s, l) => s + l.amountCents, 0);
      if (sum !== rec.amountCents) out.push(`Invoice lines total ${sum} but the amount is ${rec.amountCents}.`);
      if (rec.status === 'Paid' && !rec.paidDate) out.push('A Paid invoice needs a paid date.');
      if (rec.status !== 'Draft' && !rec.issuedDate) out.push('A sent invoice needs an issued date.');
      break;
    }
    case 'scheduleItem':
      if (rec.end < rec.start) out.push('A schedule item cannot end before it starts.');
      if (rec.dependsOn.includes(rec.id)) out.push('A schedule item cannot depend on itself.');
      break;
    case 'document':
      if (rec.status === 'Released' && !(rec.releasedAt && rec.checksum)) out.push('A Released document needs a release time and a checksum.');
      if (rec.visibility !== 'Private' && rec.status !== 'Released') out.push('Only Released documents can be Customer-shared or Public.');
      if (rec.visibility === 'Public' && !rec.publicInfo) out.push('A Public document needs its Library information.');
      if (rec.visibility !== 'Private' && rec.location && NEVER_SHARED_FOLDERS.includes(rec.location.folder)) out.push(`Documents in "${rec.location.folder}" can never be shared.`);
      if (rec.linked.recordType === 'knowledgeItem' && rec.visibility !== 'Private') out.push('Assistant context is never shared.');
      break;
    case 'knowledgeItem':
      if (rec.scope === 'Company' && (rec.accountId || rec.projectId)) out.push('Company scope has no account or project.');
      if (rec.scope === 'Customer' && !rec.accountId) out.push('Customer scope needs an account.');
      if (rec.scope === 'Project' && !rec.projectId) out.push('Project scope needs a project.');
      if (rec.kind === 'Trip plan' && !rec.trip) out.push('A trip plan needs trip details.');
      if ((ASSISTANT_CONTEXT_KINDS as readonly string[]).includes(rec.kind) && rec.summary?.byAssistant) out.push('Assistant context is written by Grant; no assistant summary.');
      break;
    case 'activity':
      if (rec.kind === 'date_change' && !rec.reason?.trim()) out.push('A date change needs a reason.');
      break;
    case 'shareLink':
      if (rec.expiresAt <= rec.createdAt) out.push('A share link must expire after it is created.');
      break;
    case 'milestone':
    case 'project':
    default:
      break;
  }
  return out;
}

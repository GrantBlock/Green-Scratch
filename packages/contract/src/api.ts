import { z } from 'zod';
import { Cents, Email, Id, IsoDate, IsoDateTime, RecordRef, RecordType } from './common.ts';
import {
  Account, AccountKind, Activity, Baseline, ChecklistItem, Contact, Document, FileRef, Invoice, Job, Lead, Milestone, Opportunity,
  Project, ScheduleItem, ShareLink, ShareScope, Visibility, schemas,
} from './records.ts';
import { ChecklistStatus, ProjectStage } from './states.ts';
import { ContactReceipt, ContactSubmission, LibraryIndex, PublicLibraryEntry, SharePage, UploadResult } from './hub.ts';

/** Conventions. See spec/api-contract.md for the prose version. */
export const API_BASE = '/api/v1';

export const ErrorCode = z.enum([
  'validation_failed', 'not_found', 'conflict', 'locked', 'invalid_transition', 'forbidden', 'rate_limited', 'expired', 'revoked',
]);
export const ApiError = z.object({
  error: z.object({ code: ErrorCode, message: z.string(), fields: z.record(z.string(), z.string()).optional() }),
});
export type ApiError = z.infer<typeof ApiError>;

export const ListQuery = z.object({
  q: z.string().optional(),
  archived: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional(),
  /** Any field of the record, for example status=Open or projectId=... */
}).catchall(z.string());

/** Record resources: list, get, create, update. Records are archived, never deleted. */
export const resources = {
  lead: { path: 'leads', create: true, update: true },
  account: { path: 'accounts', create: true, update: true },
  contact: { path: 'contacts', create: true, update: true },
  opportunity: { path: 'opportunities', create: true, update: true },
  project: { path: 'projects', create: false, update: true },
  checklistItem: { path: 'checklist-items', create: true, update: true },
  job: { path: 'jobs', create: true, update: true },
  milestone: { path: 'milestones', create: true, update: true },
  po: { path: 'purchase-orders', create: true, update: true },
  invoice: { path: 'invoices', create: false, update: true },
  event: { path: 'events', create: true, update: true },
  trip: { path: 'trips', create: true, update: true },
  scheduleItem: { path: 'schedule-items', create: true, update: true },
  baseline: { path: 'baselines', create: false, update: false },
  sourcingItem: { path: 'sourcing-items', create: true, update: true },
  expense: { path: 'expenses', create: true, update: true },
  document: { path: 'documents', create: true, update: true },
  knowledgeItem: { path: 'knowledge', create: true, update: true },
  template: { path: 'templates', create: true, update: true },
  shareLink: { path: 'share-links', create: false, update: false },
  activity: { path: 'updates', create: true, update: false },
  audit: { path: 'audit', create: false, update: false },
  registry: { path: 'registry', create: false, update: false },
} as const satisfies Record<z.infer<typeof RecordType>, { path: string; create: boolean; update: boolean }>;
export type ResourceKey = keyof typeof resources;

/** Fields the server sets. Clients never send them. */
const SERVER_FIELDS = { id: true, version: true, createdAt: true, updatedAt: true, number: true, type: true } as const;

/** Body for creating a record: the record without server fields; `archived` and `tags` optional. */
export function createInputSchema(key: ResourceKey): z.ZodType {
  const base = schemas[key] as unknown as z.ZodObject<z.ZodRawShape>;
  const mask: Record<string, true> = {};
  for (const k of Object.keys(SERVER_FIELDS)) if (k in base.shape) mask[k] = true;
  return base.omit(mask).partial({ archived: true, tags: true } as never);
}
/** Body for updating: any editable field, plus the `version` the client last saw (optimistic concurrency). */
export function updateInputSchema(key: ResourceKey): z.ZodType {
  const base = schemas[key] as unknown as z.ZodObject<z.ZodRawShape>;
  const mask: Record<string, true> = {};
  for (const k of Object.keys(SERVER_FIELDS)) if (k in base.shape) mask[k] = true;
  return base.omit(mask).partial().extend({ version: z.number().int().min(1) });
}

// ---- Actions ---------------------------------------------------------------------------------------------------

const NewAccount = z.object({ name: z.string().min(1), kind: AccountKind, clientCode: z.string().regex(/^[A-Z]{3}$/), industries: z.array(z.string()).default([]) });
const NewContact = z.object({ name: z.string().min(1), role: z.string().optional(), email: Email.optional(), phone: z.string().optional() });

export const QualifyInput = z.object({
  accountId: Id.optional(),
  newAccount: NewAccount.optional(),
  contactId: Id.optional(),
  newContact: NewContact.optional(),
  opportunityTitle: z.string().min(1),
  scopeSummary: z.string(),
  estimatedValueCents: Cents,
}).refine((v) => Number(!!v.accountId) + Number(!!v.newAccount) === 1, 'Give either accountId or newAccount.');
export const QualifyOutput = z.object({ lead: Lead, account: Account, contact: Contact.optional(), opportunity: Opportunity });

export const WinInput = z.object({ templateId: Id, cgmp: z.boolean(), contractValueCents: Cents.optional() });
export const WinOutput = z.object({
  opportunity: Opportunity, project: Project,
  checklistItems: z.array(ChecklistItem), jobs: z.array(Job), milestones: z.array(Milestone), scheduleItems: z.array(ScheduleItem),
});
export const LoseInput = z.object({ reason: z.string().min(1) });

export const SearchHit = z.object({ recordType: RecordType, recordId: Id, number: z.string().optional(), title: z.string(), snippet: z.string() });
export const SearchOutput = z.object({ hits: z.array(SearchHit) });

export const Citation = z.object({ recordType: RecordType, recordId: Id, title: z.string(), snippet: z.string() });
export const AssistantAskInput = z.object({ question: z.string().min(1), projectId: Id.optional(), accountId: Id.optional(), role: z.enum(['Quoting', 'Building', 'Supporting']).optional() });
export const AssistantAnswer = z.object({
  answer: z.string(),
  citations: z.array(Citation),
  usage: z.object({ inputTokens: z.number().int(), outputTokens: z.number().int(), costCents: z.number().int(), monthToDateCents: z.number().int(), monthlyCapCents: z.number().int() }),
});

export const MoveInput = z.object({ start: IsoDate, end: IsoDate, reason: z.string().min(1, 'A reason is required when a date changes.') });
export const TokenResult = z.object({ shareLink: ShareLink, token: z.string(), url: z.string() });

export type HttpMethod = 'GET' | 'POST' | 'PATCH';
export type Audience = 'vault' | 'hub-public' | 'hub-internal';
export interface RouteDef {
  name: string;
  method: HttpMethod;
  path: string;
  audience: Audience;
  summary: string;
  input?: z.ZodType;
  output?: z.ZodType;
}

const R = (r: RouteDef): RouteDef => r;

/** Hand-written routes that are not plain record CRUD. */
export const actionRoutes: RouteDef[] = [
  R({ name: 'leads.qualify', method: 'POST', path: '/leads/:id/qualify', audience: 'vault', summary: 'Create or match an account and contact, create the opportunity (issues a BC-Q), mark the lead Qualified.', input: QualifyInput, output: QualifyOutput }),
  R({ name: 'leads.setStatus', method: 'POST', path: '/leads/:id/status', audience: 'vault', summary: 'Move a lead to Contacted or Dismissed.', input: z.object({ status: z.enum(['Contacted', 'Dismissed', 'New']) }), output: Lead }),
  R({ name: 'opportunities.win', method: 'POST', path: '/opportunities/:id/win', audience: 'vault', summary: 'Mark Won. Activates a project (BC-B with the same digits) from a template: checklist, jobs, milestones, schedule.', input: WinInput, output: WinOutput }),
  R({ name: 'opportunities.lose', method: 'POST', path: '/opportunities/:id/lose', audience: 'vault', summary: 'Mark Lost. A reason is required.', input: LoseInput, output: Opportunity }),
  R({ name: 'opportunities.reopen', method: 'POST', path: '/opportunities/:id/reopen', audience: 'vault', summary: 'Move a Lost opportunity back to Open.', output: Opportunity }),
  R({ name: 'projects.setStage', method: 'POST', path: '/projects/:id/stage', audience: 'vault', summary: 'Move the project one step along Design, Build, Install, Closed.', input: z.object({ stage: ProjectStage }), output: Project }),
  R({ name: 'projects.createBaseline', method: 'POST', path: '/projects/:id/baselines', audience: 'vault', summary: 'Snapshot every schedule item of the project under a name.', input: z.object({ name: z.string().min(1) }), output: Baseline }),
  R({ name: 'checklistItems.setStatus', method: 'POST', path: '/checklist-items/:id/status', audience: 'vault', summary: 'Move a checklist item; attach a document when it becomes Received.', input: z.object({ status: ChecklistStatus, documentId: Id.optional() }), output: ChecklistItem }),
  R({ name: 'checklistItems.requestUpload', method: 'POST', path: '/checklist-items/:id/request', audience: 'vault', summary: 'Set the item to Requested and create a one-item upload link for the customer.', input: z.object({ expiresAt: IsoDateTime }), output: TokenResult }),
  R({ name: 'documents.release', method: 'POST', path: '/documents/:id/release', audience: 'vault', summary: 'Release a document: records the checksum and release time and locks it.', output: Document }),
  R({ name: 'documents.newRevision', method: 'POST', path: '/documents/:id/revisions', audience: 'vault', summary: 'Create the next revision of a Released document; the old one becomes Superseded.', input: z.object({ file: FileRef, checksum: z.string().optional(), sizeBytes: z.number().int().optional() }), output: z.object({ previous: Document, current: Document }) }),
  R({ name: 'documents.setVisibility', method: 'POST', path: '/documents/:id/visibility', audience: 'vault', summary: 'Make a Released document Private, Customer-shared or Public.', input: z.object({ visibility: Visibility, publicInfo: Document.shape.publicInfo.optional() }), output: Document }),
  R({ name: 'milestones.invoice', method: 'POST', path: '/milestones/:id/invoice', audience: 'vault', summary: 'Create a Draft invoice from a milestone. Nothing is sent.', input: z.object({ dueDate: IsoDate }), output: z.object({ milestone: Milestone, invoice: Invoice }) }),
  R({ name: 'invoices.send', method: 'POST', path: '/invoices/:id/send', audience: 'vault', summary: 'Mark a reviewed invoice Sent.', input: z.object({ issuedDate: IsoDate.optional() }), output: Invoice }),
  R({ name: 'invoices.markPaid', method: 'POST', path: '/invoices/:id/paid', audience: 'vault', summary: 'Mark Paid; the linked milestone becomes Paid.', input: z.object({ paidDate: IsoDate }), output: Invoice }),
  R({ name: 'scheduleItems.move', method: 'POST', path: '/schedule-items/:id/move', audience: 'vault', summary: 'Change dates. A reason is required and is written to the item\'s updates.', input: MoveInput, output: z.object({ scheduleItem: ScheduleItem, update: Activity }) }),
  R({ name: 'shareLinks.create', method: 'POST', path: '/share-links', audience: 'vault', summary: 'Create an expiring customer link. The token is returned once and never again.', input: z.object({ projectId: Id, scope: ShareScope, documentIds: z.array(Id), expiresAt: IsoDateTime }), output: TokenResult }),
  R({ name: 'shareLinks.revoke', method: 'POST', path: '/share-links/:id/revoke', audience: 'vault', summary: 'Revoke a link.', output: ShareLink }),
  R({ name: 'registry.void', method: 'POST', path: '/registry/:id/void', audience: 'vault', summary: 'Mark a number VOID. Numbers are never reused.', input: z.object({ reason: z.string().min(1) }), output: schemas.registry }),
  R({ name: 'search', method: 'GET', path: '/search', audience: 'vault', summary: 'Search records by text. Query: q, types (comma list).', output: SearchOutput }),
  R({ name: 'today', method: 'GET', path: '/today', audience: 'vault', summary: 'The Today screen: new leads, follow-ups due, overdue invoices, visits, missing documents.' }),
  R({ name: 'assistant.ask', method: 'POST', path: '/assistant/ask', audience: 'vault', summary: 'Ask the Vault Assistant. Answers cite records. It never changes anything in the proof of concept.', input: AssistantAskInput, output: AssistantAnswer }),
];

// ---- Hub: public routes and the narrow Hub-to-Vault interface ------------------------------------------------------

export const hubRoutes: RouteDef[] = [
  R({ name: 'hub.contact', method: 'POST', path: '/hub/api/contact', audience: 'hub-public', summary: 'Contact form. Creates a lead in the Vault. Only the email is validated.', input: ContactSubmission, output: ContactReceipt }),
  R({ name: 'hub.library', method: 'GET', path: '/hub/api/library', audience: 'hub-public', summary: 'Public Library entries (Released documents marked Public).', output: LibraryIndex }),
  R({ name: 'hub.libraryEntry', method: 'GET', path: '/hub/api/library/:id', audience: 'hub-public', summary: 'One public entry.', output: PublicLibraryEntry }),
  R({ name: 'hub.libraryFile', method: 'GET', path: '/hub/api/library/:id/file', audience: 'hub-public', summary: 'Download the public file.' }),
  R({ name: 'hub.sharePage', method: 'GET', path: '/hub/p/:token', audience: 'hub-public', summary: 'The customer project page for an unexpired, unrevoked link.', output: SharePage }),
  R({ name: 'hub.shareFile', method: 'GET', path: '/hub/p/:token/files/:documentId', audience: 'hub-public', summary: 'Download a Released, Customer-shared document through a link.' }),
  R({ name: 'hub.shareUpload', method: 'POST', path: '/hub/p/:token/uploads/:checklistItemId', audience: 'hub-public', summary: 'Upload a file to a requested checklist item. The item becomes Received.', output: UploadResult }),
];

export const routes: RouteDef[] = [...actionRoutes, ...hubRoutes];

/** Every resource also gets list, get, create and update routes, generated from `resources`. */
export function resourceRouteDefs(): RouteDef[] {
  const out: RouteDef[] = [];
  for (const [key, cfg] of Object.entries(resources) as [ResourceKey, (typeof resources)[ResourceKey]][]) {
    out.push(R({ name: `${cfg.path}.list`, method: 'GET', path: `/${cfg.path}`, audience: 'vault', summary: `List ${cfg.path}. Filter by any field; q for text; archived=true to include archived.`, input: ListQuery }));
    out.push(R({ name: `${cfg.path}.get`, method: 'GET', path: `/${cfg.path}/:id`, audience: 'vault', summary: `Get one record.`, output: schemas[key] as z.ZodType }));
    if (cfg.create) out.push(R({ name: `${cfg.path}.create`, method: 'POST', path: `/${cfg.path}`, audience: 'vault', summary: 'Create. The server sets id, version, timestamps and the Registry number.', input: createInputSchema(key), output: schemas[key] as z.ZodType }));
    if (cfg.update) out.push(R({ name: `${cfg.path}.update`, method: 'PATCH', path: `/${cfg.path}/:id`, audience: 'vault', summary: 'Update. Send the version you last saw; a stale version returns conflict. Released documents are locked.', input: updateInputSchema(key), output: schemas[key] as z.ZodType }));
  }
  return out;
}

export const allRoutes = (): RouteDef[] => [...resourceRouteDefs(), ...routes];

/** The only routes the Hub app may serve or call. Anything else is a boundary violation. */
export const HUB_ALLOWED_PATHS = hubRoutes.map((r) => r.path);
export { RecordRef };

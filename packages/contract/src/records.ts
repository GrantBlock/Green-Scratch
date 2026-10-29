import { z } from 'zod';
import {
  Actor, baseFields, Cents, Email, Folder, Id, IsoDate, IsoDateTime, JobCategory, RecordRef, RecordType, registryNumber, RegistryNumber, Sha256,
} from './common.ts';
import {
  ChecklistStatus, DocumentStatus, InvoiceStatus, JobStatus, LeadStatus, MilestoneStatus, OpportunityStatus, ProjectStage, SourcingStatus,
} from './states.ts';

/** Build one record schema: common fields, a literal type, and the record's own fields. */
const rec = <T extends string, S extends z.ZodRawShape>(type: T, shape: S) =>
  z.object({ ...baseFields, type: z.literal(type), ...shape });

const FolderRef = z.object({ folder: Folder, subfolder: z.string().optional() });
export type FolderRef = z.infer<typeof FolderRef>;

// ---- Leads, accounts, contacts, opportunities ------------------------------------------------------------------

export const Lead = rec('lead', {
  number: registryNumber('D'),
  source: z.enum(['contact_form', 'assistant', 'builder', 'email', 'phone', 'event', 'manual']),
  name: z.string().min(1),
  company: z.string().optional(),
  email: Email.optional(),
  phone: z.string().optional(),
  message: z.string(),
  sourceContext: z.object({ tool: z.string(), entryTitle: z.string().optional() }).optional(),
  receivedAt: IsoDateTime,
  status: LeadStatus,
  attachmentDocumentId: Id.optional(),
  transcriptDocumentId: Id.optional(),
  accountId: Id.optional(),
  opportunityId: Id.optional(),
});

export const AccountKind = z.enum(['Customer', 'Supplier', 'Prospect', 'Organization']);
export const Account = rec('account', {
  name: z.string().min(1),
  kind: AccountKind,
  clientCode: z.string().regex(/^[A-Z]{3}$/, 'three capital letters; GEN for prospects'),
  industries: z.array(z.string()),
  website: z.string().optional(),
  notes: z.string().optional(),
});

export const Contact = rec('contact', {
  accountId: Id,
  name: z.string().min(1),
  role: z.string().optional(),
  email: Email.optional(),
  phone: z.string().optional(),
  primary: z.boolean(),
});

export const Opportunity = rec('opportunity', {
  number: registryNumber('Q'),
  accountId: Id,
  contactId: Id.optional(),
  title: z.string().min(1),
  scopeSummary: z.string(),
  estimatedValueCents: Cents,
  sourceLeadId: Id.optional(),
  nextAction: z.string().optional(),
  nextActionDue: IsoDate.optional(),
  status: OpportunityStatus,
  lostReason: z.string().optional(),
  decidedDate: IsoDate.optional(),
  quoteDocumentIds: z.array(Id),
  projectId: Id.optional(),
});

// ---- Projects and their parts --------------------------------------------------------------------------------

export const Project = rec('project', {
  number: registryNumber('B'),
  accountId: Id,
  opportunityId: Id,
  title: z.string().min(1),
  contractValueCents: Cents,
  stage: ProjectStage,
  targetStart: IsoDate.optional(),
  targetEnd: IsoDate.optional(),
  templateId: Id,
  cgmp: z.boolean(),
  oneDriveUrl: z.string().optional(),
  onshapeUrls: z.array(z.string()),
});

export const ChecklistItem = rec('checklistItem', {
  projectId: Id,
  location: FolderRef,
  name: z.string().min(1),
  required: z.boolean(),
  dueDate: IsoDate.optional(),
  status: ChecklistStatus,
  documentIds: z.array(Id),
});

export const Job = rec('job', {
  number: registryNumber('J'),
  projectId: Id,
  category: JobCategory,
  description: z.string(),
  hoursEstimated: z.number().nonnegative().optional(),
  hoursActual: z.number().nonnegative().optional(),
  startDate: IsoDate.optional(),
  targetDate: IsoDate.optional(),
  actualDate: IsoDate.optional(),
  status: JobStatus,
});

export const Milestone = rec('milestone', {
  projectId: Id,
  name: z.string().min(1),
  percent: z.number().int().min(1).max(100),
  amountCents: Cents,
  dueDate: IsoDate,
  status: MilestoneStatus,
  invoiceId: Id.optional(),
});

export const Po = rec('po', {
  projectId: Id,
  accountId: Id,
  poNumber: z.string().min(1),
  amountCents: Cents,
  date: IsoDate,
  documentId: Id.optional(),
});

export const InvoiceLine = z.object({ description: z.string(), amountCents: Cents, milestoneId: Id.optional() });
export const Invoice = rec('invoice', {
  projectId: Id,
  accountId: Id,
  invoiceNumber: z.string().min(1),
  lines: z.array(InvoiceLine).min(1),
  amountCents: Cents,
  issuedDate: IsoDate.optional(),
  dueDate: IsoDate,
  paidDate: IsoDate.optional(),
  status: InvoiceStatus,
  documentId: Id.optional(),
});

// ---- Calendar and schedule -------------------------------------------------------------------------------------

export const EventKind = z.enum(['Customer visit', 'Supplier visit', 'Site measurement', 'Installation', 'Networking event', 'Trade show', 'Call', 'Other']);
export const CalEvent = rec('event', {
  kind: EventKind,
  title: z.string().min(1),
  start: IsoDateTime,
  end: IsoDateTime.optional(),
  allDay: z.boolean(),
  location: z.string().optional(),
  accountIds: z.array(Id),
  contactIds: z.array(Id),
  projectId: Id.optional(),
  opportunityId: Id.optional(),
  tripId: Id.optional(),
  purpose: z.string().optional(),
  outcomeNotes: z.string().optional(),
  photoDocumentIds: z.array(Id),
});

export const Trip = rec('trip', {
  name: z.string().min(1),
  startDate: IsoDate,
  endDate: IsoDate,
  travelNotes: z.string().optional(),
  knowledgeItemIds: z.array(Id),
});

export const ScheduleItem = rec('scheduleItem', {
  projectId: Id,
  name: z.string().min(1),
  category: z.string().min(1),
  start: IsoDate,
  end: IsoDate,
  dependsOn: z.array(Id),
  percentComplete: z.number().int().min(0).max(100),
  owner: z.string().optional(),
  sortOrder: z.number().int(),
});

export const Baseline = rec('baseline', {
  projectId: Id,
  name: z.string().min(1),
  takenAt: IsoDateTime,
  items: z.array(z.object({ scheduleItemId: Id, start: IsoDate, end: IsoDate, percentComplete: z.number().int().min(0).max(100) })),
});

export const SourcingItem = rec('sourcingItem', {
  projectId: Id,
  description: z.string().min(1),
  supplierAccountId: Id,
  quoteRequestedDate: IsoDate.optional(),
  quoteDocumentId: Id.optional(),
  priceCents: Cents.optional(),
  leadTimeDays: z.number().int().nonnegative().optional(),
  status: SourcingStatus,
  poNumber: z.string().optional(),
});

export const Expense = rec('expense', {
  date: IsoDate,
  amountCents: Cents,
  vendor: z.string().min(1),
  vendorAccountId: Id.optional(),
  category: z.string().min(1),
  /** null means Overhead. */
  projectId: Id.nullable(),
  receiptDocumentId: Id.optional(),
  source: z.enum(['manual', 'agent_email']),
  reimbursable: z.boolean(),
});

// ---- Documents, knowledge, templates, sharing --------------------------------------------------------------------

export const DocumentKind = z.enum(['Quote', 'PO', 'Invoice', 'Manual', 'Spec sheet', 'Gantt', 'ROI', 'Roadmap', 'Drawing', 'Certificate', 'Report', 'Other']);
export const Visibility = z.enum(['Private', 'Customer-shared', 'Public']);
export const FileRef = z.discriminatedUnion('storage', [
  z.object({ storage: z.literal('r2'), key: z.string().min(1) }),
  z.object({ storage: z.literal('onedrive'), url: z.string().min(1) }),
  z.object({ storage: z.literal('onshape'), url: z.string().min(1) }),
]);
export const Document = rec('document', {
  number: registryNumber('D'),
  title: z.string().min(1),
  kind: DocumentKind,
  linked: RecordRef,
  location: FolderRef.optional(),
  file: FileRef,
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  checksum: Sha256.optional(),
  revision: z.number().int().min(1),
  status: DocumentStatus,
  visibility: Visibility,
  supersedesId: Id.optional(),
  releasedAt: IsoDateTime.optional(),
  /** Only for Public documents shown in the Library. Tab, then item, then the entry itself. */
  publicInfo: z.object({ tab: z.string(), item: z.string(), description: z.string(), whenToUse: z.string() }).optional(),
});

export const KnowledgeKind = z.enum(['Application research', 'Sales research', 'Article', 'Trip plan', 'Note', 'Configuration', 'Glossary', 'Standard work']);
export const ASSISTANT_CONTEXT_KINDS = ['Configuration', 'Glossary', 'Standard work'] as const;
export const KnowledgeItem = rec('knowledgeItem', {
  number: registryNumber('K'),
  kind: KnowledgeKind,
  title: z.string().min(1),
  /** Company has no link; Customer links an account; Project links a project. */
  scope: z.enum(['Company', 'Customer', 'Project']),
  accountId: Id.optional(),
  projectId: Id.optional(),
  body: z.string(),
  sourceUrl: z.string().optional(),
  summary: z.object({ text: z.string(), byAssistant: z.boolean() }).optional(),
  trip: z.object({
    startDate: IsoDate, endDate: IsoDate, locations: z.array(z.string()),
    itinerary: z.array(z.object({ date: IsoDate, text: z.string(), accountId: Id.optional() })),
  }).optional(),
});

export const TemplateKind = z.enum(['Customer structure', 'Project structure', 'Checklist', 'Document template', 'Work order']);
export const ProjectStructureDefinition = z.object({
  folders: z.array(z.object({ folder: Folder, subfolders: z.array(z.string()).optional() })),
  checklist: z.array(z.object({ location: FolderRef, name: z.string(), required: z.boolean() })),
  jobs: z.array(z.object({ category: JobCategory, description: z.string() })),
  milestones: z.array(z.object({ name: z.string(), percent: z.number().int().min(1).max(100) })),
  schedule: z.array(z.object({ name: z.string(), category: z.string(), durationDays: z.number().int().min(1), dependsOnIndex: z.number().int().min(0).optional() })),
});
export const Template = rec('template', {
  number: registryNumber('L'),
  kind: TemplateKind,
  name: z.string().min(1),
  /** True for the cGMP documentation package: adds a "cGMP Package" subfolder under "Documentation - Project". */
  cgmpOption: z.boolean(),
  definition: z.union([ProjectStructureDefinition, z.record(z.string(), z.unknown())]),
});

export const ShareScope = z.discriminatedUnion('type', [
  z.object({ type: z.literal('view') }),
  z.object({ type: z.literal('upload'), checklistItemId: Id }),
]);
export const ShareLink = rec('shareLink', {
  projectId: Id,
  scope: ShareScope,
  /** Only Customer-shared, Released documents in this list are visible. Empty means every such document of the project. */
  documentIds: z.array(Id),
  expiresAt: IsoDateTime,
  revoked: z.boolean(),
  lastUsedAt: IsoDateTime.optional(),
});

// ---- Updates, audit, registry ------------------------------------------------------------------------------------

export const Activity = rec('activity', {
  about: RecordRef,
  kind: z.enum(['note', 'system', 'email', 'date_change', 'state_change']),
  text: z.string(),
  actor: Actor,
  at: IsoDateTime,
  /** Required when kind is date_change. */
  reason: z.string().optional(),
});

export const AuditEvent = rec('audit', {
  actor: Actor,
  action: z.string().min(1),
  /** The record the action was about. Absent for events with no subject, such as assistant usage. */
  about: RecordRef.optional(),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  at: IsoDateTime,
});

export const RegistryEntry = rec('registry', {
  number: RegistryNumber,
  registryType: z.enum(['Q', 'B', 'J', 'D', 'K', 'L', 'W']),
  status: z.enum(['Issued', 'Void']),
  about: RecordRef.optional(),
  voidReason: z.string().optional(),
});

// ---- Registry of schemas -----------------------------------------------------------------------------------------

export const schemas = {
  lead: Lead, account: Account, contact: Contact, opportunity: Opportunity, project: Project, checklistItem: ChecklistItem,
  job: Job, milestone: Milestone, po: Po, invoice: Invoice, event: CalEvent, trip: Trip, scheduleItem: ScheduleItem,
  baseline: Baseline, sourcingItem: SourcingItem, expense: Expense, document: Document, knowledgeItem: KnowledgeItem,
  template: Template, shareLink: ShareLink, activity: Activity, audit: AuditEvent, registry: RegistryEntry,
} as const satisfies Record<z.infer<typeof RecordType>, z.ZodType>;

export type Schemas = typeof schemas;
export type RecordOf<K extends keyof Schemas> = z.infer<Schemas[K]>;
export type Lead = RecordOf<'lead'>;
export type Account = RecordOf<'account'>;
export type Contact = RecordOf<'contact'>;
export type Opportunity = RecordOf<'opportunity'>;
export type Project = RecordOf<'project'>;
export type ChecklistItem = RecordOf<'checklistItem'>;
export type Job = RecordOf<'job'>;
export type Milestone = RecordOf<'milestone'>;
export type Po = RecordOf<'po'>;
export type Invoice = RecordOf<'invoice'>;
export type CalEvent = RecordOf<'event'>;
export type Trip = RecordOf<'trip'>;
export type ScheduleItem = RecordOf<'scheduleItem'>;
export type Baseline = RecordOf<'baseline'>;
export type SourcingItem = RecordOf<'sourcingItem'>;
export type Expense = RecordOf<'expense'>;
export type Document = RecordOf<'document'>;
export type KnowledgeItem = RecordOf<'knowledgeItem'>;
export type Template = RecordOf<'template'>;
export type ShareLink = RecordOf<'shareLink'>;
export type Activity = RecordOf<'activity'>;
export type AuditEvent = RecordOf<'audit'>;
export type RegistryEntry = RecordOf<'registry'>;
export type ProjectStructureDefinition = z.infer<typeof ProjectStructureDefinition>;
export type AnyRecord = { [K in keyof Schemas]: RecordOf<K> }[keyof Schemas];

/** The record kinds that carry a Registry number, and which type each uses. */
export const numberedTypes = { lead: 'D', opportunity: 'Q', project: 'B', job: 'J', document: 'D', knowledgeItem: 'K', template: 'L' } as const;

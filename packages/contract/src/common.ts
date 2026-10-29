import { z } from 'zod';

/** Primitive shapes shared by every record. Money is integer cents, never a float. */
export const Id = z.string().min(1);
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');
export const IsoDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/, 'ISO 8601 date-time');
export const Cents = z.number().int();
export const Email = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email');
export const Sha256 = z.string().regex(/^[0-9a-f]{64}$/, 'sha-256 hex');

/** Registry types in use. W is the Builder configuration. See spec/data-model.md "Lifecycle and states". */
export const RegistryType = z.enum(['Q', 'B', 'J', 'D', 'K', 'L', 'W']);
export type RegistryType = z.infer<typeof RegistryType>;

/** BC-[TYPE]-YYNNN, for example BC-Q-26014. */
export const registryNumber = <T extends RegistryType>(t: T) => z.string().regex(new RegExp(`^BC-${t}-\\d{5}$`), `BC-${t}-YYNNN`);
export const RegistryNumber = z.string().regex(/^BC-[QBJDKLW]-\d{5}$/, 'BC-[TYPE]-YYNNN');

export const Actor = z.enum(['grant', 'assistant', 'share_link', 'system']);
export type Actor = z.infer<typeof Actor>;

/** Fields on every record. */
export const baseFields = {
  id: Id,
  version: z.number().int().min(1),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
  archived: z.boolean(),
  tags: z.array(z.string()),
};

/** The folder structure from docs/FOLDER-STRUCTURE.md. */
export const CUSTOMER_FOLDERS = [
  'Archive - Customer',
  'Finance, Sales, and Servicing - Customer',
  'Inbox - Customer',
  'Documents - Customer',
  'Temp - Customer',
  'Project - Customer',
  'Claude - Customer',
] as const;
export const PROJECT_FOLDERS = [
  'Customer Correspondence',
  'Documentation - Project',
  'Electrical - Project',
  'Mechanical - Project',
  'Temp - Project',
  'Supplier Correspondence',
  'Claude - Project',
] as const;
export const Folder = z.enum([...CUSTOMER_FOLDERS, ...PROJECT_FOLDERS]);
export type Folder = z.infer<typeof Folder>;
/** Folders that are never indexed or shared. */
export const NEVER_SHARED_FOLDERS: readonly Folder[] = ['Temp - Customer', 'Temp - Project', 'Inbox - Customer', 'Claude - Customer', 'Claude - Project'];

export const JobCategory = z.enum(['03', '06', '09', '12', '15', '18', '21', '24', '27']);
export const JOB_CATEGORY_NAMES: Record<z.infer<typeof JobCategory>, string> = {
  '03': 'Electrical', '06': 'Mechanical', '09': 'Hardware', '12': 'Supplies', '15': 'Made-in',
  '18': 'Assembly', '21': 'Item', '24': 'Engineering', '27': 'DevOps',
};

export const RecordType = z.enum([
  'lead', 'account', 'contact', 'opportunity', 'project', 'checklistItem', 'job', 'milestone', 'po', 'invoice',
  'event', 'trip', 'scheduleItem', 'baseline', 'sourcingItem', 'expense', 'document', 'knowledgeItem', 'template',
  'shareLink', 'activity', 'audit', 'registry',
]);
export type RecordType = z.infer<typeof RecordType>;

export const RecordRef = z.object({ recordType: RecordType, recordId: Id });
export type RecordRef = z.infer<typeof RecordRef>;

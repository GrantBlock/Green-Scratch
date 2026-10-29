import type { RecordType } from './common.ts';

/** Every field that points at another record. Used by tests and by the server to keep links valid. */
export interface RefRule {
  from: RecordType;
  field: string;
  to: RecordType | readonly RecordType[];
  many?: boolean;
  /** Dotted path for fields inside a nested object, e.g. "linked.recordId" handled by the checker. */
  nested?: boolean;
}

export const refRules: readonly RefRule[] = [
  { from: 'lead', field: 'attachmentDocumentId', to: 'document' },
  { from: 'lead', field: 'transcriptDocumentId', to: 'document' },
  { from: 'lead', field: 'accountId', to: 'account' },
  { from: 'lead', field: 'opportunityId', to: 'opportunity' },
  { from: 'contact', field: 'accountId', to: 'account' },
  { from: 'opportunity', field: 'accountId', to: 'account' },
  { from: 'opportunity', field: 'contactId', to: 'contact' },
  { from: 'opportunity', field: 'sourceLeadId', to: 'lead' },
  { from: 'opportunity', field: 'quoteDocumentIds', to: 'document', many: true },
  { from: 'opportunity', field: 'projectId', to: 'project' },
  { from: 'project', field: 'accountId', to: 'account' },
  { from: 'project', field: 'opportunityId', to: 'opportunity' },
  { from: 'project', field: 'templateId', to: 'template' },
  { from: 'checklistItem', field: 'projectId', to: 'project' },
  { from: 'checklistItem', field: 'documentIds', to: 'document', many: true },
  { from: 'job', field: 'projectId', to: 'project' },
  { from: 'milestone', field: 'projectId', to: 'project' },
  { from: 'milestone', field: 'invoiceId', to: 'invoice' },
  { from: 'po', field: 'projectId', to: 'project' },
  { from: 'po', field: 'accountId', to: 'account' },
  { from: 'po', field: 'documentId', to: 'document' },
  { from: 'invoice', field: 'projectId', to: 'project' },
  { from: 'invoice', field: 'accountId', to: 'account' },
  { from: 'invoice', field: 'documentId', to: 'document' },
  { from: 'event', field: 'accountIds', to: 'account', many: true },
  { from: 'event', field: 'contactIds', to: 'contact', many: true },
  { from: 'event', field: 'projectId', to: 'project' },
  { from: 'event', field: 'opportunityId', to: 'opportunity' },
  { from: 'event', field: 'tripId', to: 'trip' },
  { from: 'event', field: 'photoDocumentIds', to: 'document', many: true },
  { from: 'trip', field: 'knowledgeItemIds', to: 'knowledgeItem', many: true },
  { from: 'scheduleItem', field: 'projectId', to: 'project' },
  { from: 'scheduleItem', field: 'dependsOn', to: 'scheduleItem', many: true },
  { from: 'baseline', field: 'projectId', to: 'project' },
  { from: 'sourcingItem', field: 'projectId', to: 'project' },
  { from: 'sourcingItem', field: 'supplierAccountId', to: 'account' },
  { from: 'sourcingItem', field: 'quoteDocumentId', to: 'document' },
  { from: 'expense', field: 'vendorAccountId', to: 'account' },
  { from: 'expense', field: 'projectId', to: 'project' },
  { from: 'expense', field: 'receiptDocumentId', to: 'document' },
  { from: 'document', field: 'supersedesId', to: 'document' },
  { from: 'knowledgeItem', field: 'accountId', to: 'account' },
  { from: 'knowledgeItem', field: 'projectId', to: 'project' },
  { from: 'shareLink', field: 'projectId', to: 'project' },
  { from: 'shareLink', field: 'documentIds', to: 'document', many: true },
];

/** Fields holding a {recordType, recordId} reference. */
export const recordRefFields: readonly { from: RecordType; field: string }[] = [
  { from: 'document', field: 'linked' },
  { from: 'activity', field: 'about' },
  { from: 'audit', field: 'about' },
  { from: 'registry', field: 'about' },
];

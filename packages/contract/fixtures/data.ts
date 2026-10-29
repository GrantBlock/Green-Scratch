/**
 * Example data for the proof of concept. Every name is fictional. "Today" for the fixtures is 2026-10-29.
 * Used by the mock server, by tests, and by design and UI work. Type-checked against the contract, then validated
 * by validateDataset in test/contract.test.ts.
 */
import type { Dataset } from '../src/dataset.ts';
import type { RegistryEntry } from '../src/records.ts';
import { numberedTypes } from '../src/records.ts';

export const FIXTURE_TODAY = '2026-10-29';
export const FIXTURE_NOW = '2026-10-29T15:00:00Z';

const base = (id: string, at = '2026-09-15T14:00:00Z') => ({ id, version: 1, createdAt: at, updatedAt: at, archived: false, tags: [] as string[] });

/** A stable fake sha-256 so fixtures need no crypto. */
const sha = (seed: string): string => {
  let h = 2166136261;
  let out = '';
  for (let i = 0; out.length < 64; i++) {
    h = Math.imul(h ^ (seed.charCodeAt(i % seed.length) + i), 16777619) >>> 0;
    out += h.toString(16).padStart(8, '0');
  }
  return out.slice(0, 64);
};

const PF = 'Project - Customer';

// ---- Accounts and contacts ---------------------------------------------------------------------------------------

const accounts: Dataset['account'] = [
  { ...base('acc-meridian'), type: 'account', name: 'Meridian Packaging Co.', kind: 'Customer', clientCode: 'MPC', industries: ['Packaging and dispensing'], website: 'https://example.com/meridian' },
  { ...base('acc-harbor'), type: 'account', name: 'Harbor Lab Diagnostics', kind: 'Customer', clientCode: 'HLD', industries: ['Laboratory and diagnostics'], notes: 'Operates under cGMP. Documentation package required.' },
  { ...base('acc-prairie'), type: 'account', name: 'Prairie Foods Co-op', kind: 'Customer', clientCode: 'PFC', industries: ['Material handling'] },
  { ...base('acc-vertex'), type: 'account', name: 'Vertex Motion Supply', kind: 'Supplier', clientCode: 'VMS', industries: [] },
  { ...base('acc-ironline'), type: 'account', name: 'Ironline Conveyor Parts', kind: 'Supplier', clientCode: 'ILC', industries: [] },
  { ...base('acc-lakeside'), type: 'account', name: 'Lakeside Medical Devices', kind: 'Prospect', clientCode: 'GEN', industries: ['Medical device'] },
  { ...base('acc-plains'), type: 'account', name: 'Plains Manufacturing Association', kind: 'Organization', clientCode: 'PMA', industries: [] },
  { ...base('acc-bc'), type: 'account', name: 'Block Concepts LLC', kind: 'Organization', clientCode: 'BCL', industries: [], notes: 'Own record. Public documents are linked here.' },
];

const contacts: Dataset['contact'] = [
  { ...base('con-meridian-1'), type: 'contact', accountId: 'acc-meridian', name: 'Dana Whitfield', role: 'Operations manager', email: 'dana@example.com', phone: '555-0101', primary: true },
  { ...base('con-meridian-2'), type: 'contact', accountId: 'acc-meridian', name: 'Chris Ortega', role: 'Maintenance lead', email: 'chris@example.com', primary: false },
  { ...base('con-harbor-1'), type: 'contact', accountId: 'acc-harbor', name: 'Priya Raman', role: 'Quality engineer', email: 'priya@example.com', phone: '555-0102', primary: true },
  { ...base('con-prairie-1'), type: 'contact', accountId: 'acc-prairie', name: 'Sam Keller', role: 'Plant manager', email: 'sam@example.com', phone: '555-0103', primary: true },
  { ...base('con-vertex-1'), type: 'contact', accountId: 'acc-vertex', name: 'Jo Alvarez', role: 'Sales engineer', email: 'jo@example.com', primary: true },
  { ...base('con-ironline-1'), type: 'contact', accountId: 'acc-ironline', name: 'Terry Nguyen', role: 'Inside sales', email: 'terry@example.com', primary: true },
  { ...base('con-lakeside-1'), type: 'contact', accountId: 'acc-lakeside', name: 'Morgan Ellis', role: 'Manufacturing engineer', email: 'morgan@example.com', phone: '555-0104', primary: true },
  { ...base('con-plains-1'), type: 'contact', accountId: 'acc-plains', name: 'Riley Brooks', role: 'Events coordinator', email: 'riley@example.com', primary: true },
];

// ---- Leads and opportunities -----------------------------------------------------------------------------------

const leads: Dataset['lead'] = [
  { ...base('lead-1', '2026-10-28T16:20:00Z'), type: 'lead', number: 'BC-D-26001', source: 'contact_form', name: 'Alex Rivera', company: 'Northgate Beverage', email: 'alex@example.com', phone: '555-0110', message: 'We need a way to count and orient bottles before the labeler. Can you take a look?', sourceContext: { tool: 'Contact' }, receivedAt: '2026-10-28T16:20:00Z', status: 'New' },
  { ...base('lead-2', '2026-10-24T13:05:00Z'), type: 'lead', number: 'BC-D-26002', source: 'phone', name: 'Jamie Cho', company: 'Eastfield Plastics', phone: '555-0111', message: 'Called about a press-side conveyor. Wants a visit next week.', receivedAt: '2026-10-24T13:05:00Z', status: 'Contacted' },
  { ...base('lead-3', '2026-10-15T09:40:00Z'), type: 'lead', number: 'BC-D-26003', source: 'contact_form', name: 'Morgan Ellis', company: 'Lakeside Medical Devices', email: 'morgan@example.com', message: 'Looking for a vision inspection station for a small assembly.', sourceContext: { tool: 'Library', entryTitle: 'Vision inspection requirements' }, receivedAt: '2026-10-15T09:40:00Z', status: 'Qualified', accountId: 'acc-lakeside', opportunityId: 'opp-5' },
  { ...base('lead-4', '2026-10-02T11:00:00Z'), type: 'lead', number: 'BC-D-26004', source: 'email', name: 'R. Patel', email: 'rp@example.com', message: 'Offering lead lists for manufacturing contacts.', receivedAt: '2026-10-02T11:00:00Z', status: 'Dismissed' },
];

const opportunities: Dataset['opportunity'] = [
  { ...base('opp-1', '2026-06-10T15:00:00Z'), type: 'opportunity', number: 'BC-Q-26011', accountId: 'acc-meridian', contactId: 'con-meridian-1', title: 'Cap torque measurement station', scopeSummary: 'Servo-based torque measurement and reject on an existing capping line.', estimatedValueCents: 4850000, status: 'Won', decidedDate: '2026-07-20', quoteDocumentIds: ['doc-quote-1'], projectId: 'proj-1' },
  { ...base('opp-2', '2026-08-05T15:00:00Z'), type: 'opportunity', number: 'BC-Q-26014', accountId: 'acc-harbor', contactId: 'con-harbor-1', title: 'Offline dimensional inspection cell', scopeSummary: 'Offline 3D inspection cell with documentation for a cGMP site.', estimatedValueCents: 13200000, status: 'Won', decidedDate: '2026-09-18', quoteDocumentIds: ['doc-quote-2'], projectId: 'proj-2' },
  { ...base('opp-3', '2026-09-30T15:00:00Z'), type: 'opportunity', number: 'BC-Q-26015', accountId: 'acc-prairie', contactId: 'con-prairie-1', title: 'VFD control enclosure for conveyor', scopeSummary: 'Panel build and commissioning for a replacement conveyor drive.', estimatedValueCents: 2250000, nextAction: 'Send revised quote after site measurement', nextActionDue: '2026-10-28', status: 'Open', quoteDocumentIds: [] },
  { ...base('opp-4', '2026-10-05T15:00:00Z'), type: 'opportunity', number: 'BC-Q-26016', accountId: 'acc-meridian', contactId: 'con-meridian-2', title: 'Case packer retrofit', scopeSummary: 'Retrofit of a case packer infeed.', estimatedValueCents: 6100000, nextAction: 'Review drawings with maintenance', nextActionDue: '2026-11-05', status: 'Open', quoteDocumentIds: [] },
  { ...base('opp-5', '2026-10-16T15:00:00Z'), type: 'opportunity', number: 'BC-Q-26017', accountId: 'acc-lakeside', contactId: 'con-lakeside-1', title: 'Vision inspection station', scopeSummary: 'Small-assembly vision inspection with reject.', estimatedValueCents: 3400000, sourceLeadId: 'lead-3', nextAction: 'Call to confirm part sizes', nextActionDue: '2026-11-02', status: 'Open', quoteDocumentIds: [] },
  { ...base('opp-6', '2026-05-12T15:00:00Z'), type: 'opportunity', number: 'BC-Q-26018', accountId: 'acc-prairie', title: 'Pallet wrapper integration', scopeSummary: 'Integrate a new pallet wrapper with existing conveyors.', estimatedValueCents: 1800000, status: 'Lost', lostReason: 'Customer chose an in-house build.', decidedDate: '2026-06-30', quoteDocumentIds: [] },
  { ...base('opp-7', '2026-10-10T15:00:00Z'), type: 'opportunity', number: 'BC-Q-26019', accountId: 'acc-harbor', contactId: 'con-harbor-1', title: 'Sample transfer conveyor', scopeSummary: 'Washdown conveyor between two lab stations.', estimatedValueCents: 2900000, nextAction: 'Prepare concept layout', nextActionDue: '2026-11-12', status: 'Open', quoteDocumentIds: [] },
  { ...base('opp-8', '2026-10-20T15:00:00Z'), type: 'opportunity', number: 'BC-Q-26020', accountId: 'acc-lakeside', title: 'Feeder upgrade', scopeSummary: 'Replace a vibratory feeder.', estimatedValueCents: 950000, status: 'Open', quoteDocumentIds: [] },
];

// ---- Templates ----------------------------------------------------------------------------------------------------

const templates: Dataset['template'] = [
  {
    ...base('tpl-project'), type: 'template', number: 'BC-L-26001', kind: 'Project structure', name: 'Standard project', cgmpOption: false,
    definition: {
      folders: [
        { folder: 'Customer Correspondence' }, { folder: 'Documentation - Project' }, { folder: 'Electrical - Project' },
        { folder: 'Mechanical - Project' }, { folder: 'Temp - Project' }, { folder: 'Supplier Correspondence' }, { folder: 'Claude - Project' },
      ],
      checklist: [
        { location: { folder: 'Finance, Sales, and Servicing - Customer' }, name: 'Customer purchase order', required: true },
        { location: { folder: 'Customer Correspondence' }, name: 'Customer layout and requirements', required: true },
        { location: { folder: 'Mechanical - Project' }, name: 'Mechanical drawings', required: true },
        { location: { folder: 'Electrical - Project' }, name: 'Electrical drawings', required: true },
        { location: { folder: 'Supplier Correspondence' }, name: 'Supplier data sheets and quotes', required: true },
        { location: { folder: 'Documentation - Project' }, name: 'Operating manual', required: true },
        { location: { folder: 'Documentation - Project' }, name: 'Spec sheet', required: true },
        { location: { folder: 'Documentation - Project' }, name: 'Project schedule export', required: false },
        { location: { folder: 'Documentation - Project' }, name: 'ROI summary', required: false },
      ],
      jobs: [{ category: '24', description: 'Engineering' }, { category: '06', description: 'Mechanical build' }, { category: '03', description: 'Electrical build' }],
      milestones: [{ name: 'Deposit', percent: 60 }, { name: 'Delivery', percent: 30 }, { name: 'Acceptance', percent: 10 }],
      schedule: [
        { name: 'Concept and specifications', category: 'Design', durationDays: 10 },
        { name: 'Detailed design', category: 'Design', durationDays: 15, dependsOnIndex: 0 },
        { name: 'Order long-lead parts', category: 'Sourcing', durationDays: 5, dependsOnIndex: 1 },
        { name: 'Fabrication and assembly', category: 'Build', durationDays: 25, dependsOnIndex: 2 },
        { name: 'Factory acceptance test', category: 'Build', durationDays: 3, dependsOnIndex: 3 },
        { name: 'Site installation and acceptance', category: 'Install', durationDays: 7, dependsOnIndex: 4 },
      ],
    },
  },
  {
    ...base('tpl-cgmp'), type: 'template', number: 'BC-L-26002', kind: 'Checklist', name: 'cGMP documentation package', cgmpOption: true,
    definition: {
      subfolder: 'cGMP Package', under: 'Documentation - Project',
      checklist: [
        { name: 'Material certificates', required: true }, { name: 'Surface finish and cleanability data', required: true },
        { name: 'Component list with certificates', required: true }, { name: 'Test results', required: true },
      ],
    },
  },
  { ...base('tpl-customer'), type: 'template', number: 'BC-L-26003', kind: 'Customer structure', name: 'Standard customer folders', cgmpOption: false, definition: { folders: ['Archive - Customer', 'Finance, Sales, and Servicing - Customer', 'Inbox - Customer', 'Documents - Customer', 'Temp - Customer', 'Project - Customer', 'Claude - Customer'] } },
];

// ---- Projects ----------------------------------------------------------------------------------------------------

const projects: Dataset['project'] = [
  { ...base('proj-1', '2026-07-20T15:00:00Z'), type: 'project', number: 'BC-B-26011', accountId: 'acc-meridian', opportunityId: 'opp-1', title: 'Cap torque measurement station', contractValueCents: 4850000, stage: 'Build', targetStart: '2026-08-03', targetEnd: '2026-12-18', templateId: 'tpl-project', cgmp: false, oneDriveUrl: 'https://example.com/onedrive/meridian/BC-B-26011', onshapeUrls: ['https://example.com/onshape/torque-station'] },
  { ...base('proj-2', '2026-09-18T15:00:00Z'), type: 'project', number: 'BC-B-26014', accountId: 'acc-harbor', opportunityId: 'opp-2', title: 'Offline dimensional inspection cell', contractValueCents: 13200000, stage: 'Design', targetStart: '2026-10-01', targetEnd: '2027-03-31', templateId: 'tpl-project', cgmp: true, onshapeUrls: [] },
];

// ---- Documents ---------------------------------------------------------------------------------------------------

const rel = '2026-09-01T12:00:00Z';
const doc = (id: string, n: number, title: string, kind: Dataset['document'][number]['kind'], linked: { recordType: Dataset['activity'][number]['about']['recordType']; recordId: string }, location: { folder: Dataset['document'][number]['location'] extends infer L ? (L extends { folder: infer F } ? F : never) : never; subfolder?: string } | undefined, extra: Partial<Dataset['document'][number]> = {}): Dataset['document'][number] => ({
  ...base(id), type: 'document', number: `BC-D-${26000 + n}`, title, kind, linked, location, file: { storage: 'r2', key: `docs/BC-D-${26000 + n}.pdf` },
  mimeType: 'application/pdf', sizeBytes: 120_000 + n * 1000, checksum: sha(id), revision: 1, status: 'Released', visibility: 'Private', releasedAt: rel, ...extra,
});

const documents: Dataset['document'] = [
  doc('doc-po-1', 5, 'Meridian purchase order PO-77310', 'PO', { recordType: 'project', recordId: 'proj-1' }, { folder: 'Finance, Sales, and Servicing - Customer' }),
  doc('doc-quote-1', 6, 'Quote BC-Q-26011', 'Quote', { recordType: 'opportunity', recordId: 'opp-1' }, { folder: 'Documents - Customer' }),
  doc('doc-quote-2', 7, 'Quote BC-Q-26014', 'Quote', { recordType: 'opportunity', recordId: 'opp-2' }, { folder: 'Documents - Customer' }),
  doc('doc-mech-1', 8, 'Torque station assembly drawing', 'Drawing', { recordType: 'project', recordId: 'proj-1' }, { folder: 'Mechanical - Project' }, { status: 'In review', releasedAt: undefined, checksum: undefined }),
  doc('doc-manual-1', 9, 'Torque station operating manual', 'Manual', { recordType: 'project', recordId: 'proj-1' }, { folder: 'Documentation - Project' }, { visibility: 'Customer-shared' }),
  doc('doc-spec-1', 10, 'Torque station spec sheet', 'Spec sheet', { recordType: 'project', recordId: 'proj-1' }, { folder: 'Documentation - Project' }, { visibility: 'Customer-shared' }),
  doc('doc-supplier-1', 11, 'Servo motor quote', 'Quote', { recordType: 'project', recordId: 'proj-1' }, { folder: 'Supplier Correspondence' }),
  doc('doc-elec-1', 12, 'Control panel schematic', 'Drawing', { recordType: 'project', recordId: 'proj-1' }, { folder: 'Electrical - Project' }),
  doc('doc-layout-2', 13, 'Customer layout and requirements', 'Other', { recordType: 'project', recordId: 'proj-2' }, { folder: 'Customer Correspondence' }),
  doc('doc-library-old', 14, 'Conveyor enclosure application requirements', 'Spec sheet', { recordType: 'account', recordId: 'acc-bc' }, undefined, { status: 'Superseded', releasedAt: '2026-05-01T12:00:00Z' }),
  doc('doc-library-1', 15, 'Conveyor enclosure application requirements', 'Spec sheet', { recordType: 'account', recordId: 'acc-bc' }, undefined, {
    revision: 2, supersedesId: 'doc-library-old', visibility: 'Public',
    publicInfo: { tab: 'Controls', item: 'Enclosures', description: 'What we need to know to quote a control enclosure for a conveyor drive.', whenToUse: 'Before asking for a quote on a panel or drive replacement.' },
  }),
  doc('doc-library-2', 16, 'Vision inspection requirements', 'Spec sheet', { recordType: 'account', recordId: 'acc-bc' }, undefined, {
    visibility: 'Public', publicInfo: { tab: 'Inspection', item: 'Vision', description: 'Part sizes, tolerances and reject methods to settle first.', whenToUse: 'When you are considering automated visual inspection.' },
  }),
  doc('doc-invoice-1', 17, 'Invoice INV-2026-014', 'Invoice', { recordType: 'invoice', recordId: 'inv-1' }, { folder: 'Finance, Sales, and Servicing - Customer' }),
  doc('doc-receipt-1', 18, 'Fastener supply receipt', 'Other', { recordType: 'expense', recordId: 'exp-1' }, undefined),
];

// ---- Checklist, jobs, money ------------------------------------------------------------------------------------

const ci = (id: string, projectId: string, folder: string, name: string, required: boolean, status: Dataset['checklistItem'][number]['status'], documentIds: string[] = [], extra: Partial<Dataset['checklistItem'][number]> = {}): Dataset['checklistItem'][number] => ({
  ...base(id), type: 'checklistItem', projectId, location: { folder: folder as Dataset['checklistItem'][number]['location']['folder'] }, name, required, status, documentIds, ...extra,
});
const checklistItems: Dataset['checklistItem'] = [
  ci('ci-1-po', 'proj-1', 'Finance, Sales, and Servicing - Customer', 'Customer purchase order', true, 'Released', ['doc-po-1']),
  ci('ci-1-layout', 'proj-1', 'Customer Correspondence', 'Customer layout and requirements', true, 'Received', ['doc-quote-1']),
  ci('ci-1-mech', 'proj-1', 'Mechanical - Project', 'Mechanical drawings', true, 'In review', ['doc-mech-1']),
  ci('ci-1-elec', 'proj-1', 'Electrical - Project', 'Electrical drawings', true, 'Released', ['doc-elec-1']),
  ci('ci-1-supplier', 'proj-1', 'Supplier Correspondence', 'Supplier data sheets and quotes', true, 'Released', ['doc-supplier-1']),
  ci('ci-1-manual', 'proj-1', 'Documentation - Project', 'Operating manual', true, 'Released', ['doc-manual-1']),
  ci('ci-1-spec', 'proj-1', 'Documentation - Project', 'Spec sheet', true, 'Released', ['doc-spec-1']),
  ci('ci-1-sched', 'proj-1', 'Documentation - Project', 'Project schedule export', false, 'Missing'),
  ci('ci-1-roi', 'proj-1', 'Documentation - Project', 'ROI summary', false, 'Missing'),
  ci('ci-2-po', 'proj-2', 'Finance, Sales, and Servicing - Customer', 'Customer purchase order', true, 'Requested', [], { dueDate: '2026-10-20' }),
  ci('ci-2-layout', 'proj-2', 'Customer Correspondence', 'Customer layout and requirements', true, 'Received', ['doc-layout-2']),
  ci('ci-2-mech', 'proj-2', 'Mechanical - Project', 'Mechanical drawings', true, 'Missing', [], { dueDate: '2026-10-25' }),
  ci('ci-2-elec', 'proj-2', 'Electrical - Project', 'Electrical drawings', true, 'Missing'),
  ci('ci-2-supplier', 'proj-2', 'Supplier Correspondence', 'Supplier data sheets and quotes', true, 'Missing'),
  ci('ci-2-manual', 'proj-2', 'Documentation - Project', 'Operating manual', true, 'Missing'),
  { ...ci('ci-2-cgmp-1', 'proj-2', 'Documentation - Project', 'Material certificates', true, 'Missing'), location: { folder: 'Documentation - Project', subfolder: 'cGMP Package' } },
  { ...ci('ci-2-cgmp-2', 'proj-2', 'Documentation - Project', 'Surface finish and cleanability data', true, 'Missing'), location: { folder: 'Documentation - Project', subfolder: 'cGMP Package' } },
];

const jobs: Dataset['job'] = [
  { ...base('job-1'), type: 'job', number: 'BC-J-26001', projectId: 'proj-1', category: '24', description: 'Engineering', hoursEstimated: 80, hoursActual: 62, startDate: '2026-08-03', targetDate: '2026-09-18', status: 'Complete', actualDate: '2026-09-22' },
  { ...base('job-2'), type: 'job', number: 'BC-J-26002', projectId: 'proj-1', category: '06', description: 'Mechanical build', hoursEstimated: 120, hoursActual: 40, startDate: '2026-10-05', targetDate: '2026-11-20', status: 'In progress' },
  { ...base('job-3'), type: 'job', number: 'BC-J-26003', projectId: 'proj-1', category: '03', description: 'Electrical build', hoursEstimated: 60, startDate: '2026-11-09', targetDate: '2026-12-04', status: 'Not started' },
  { ...base('job-4'), type: 'job', number: 'BC-J-26004', projectId: 'proj-2', category: '24', description: 'Engineering', hoursEstimated: 240, hoursActual: 30, startDate: '2026-10-01', targetDate: '2026-12-15', status: 'In progress' },
];

const milestones: Dataset['milestone'] = [
  { ...base('ms-1-a'), type: 'milestone', projectId: 'proj-1', name: 'Deposit', percent: 60, amountCents: 2910000, dueDate: '2026-07-31', status: 'Paid', invoiceId: 'inv-1' },
  { ...base('ms-1-b'), type: 'milestone', projectId: 'proj-1', name: 'Delivery', percent: 30, amountCents: 1455000, dueDate: '2026-10-10', status: 'Invoiced', invoiceId: 'inv-2' },
  { ...base('ms-1-c'), type: 'milestone', projectId: 'proj-1', name: 'Acceptance', percent: 10, amountCents: 485000, dueDate: '2027-01-15', status: 'Pending' },
  { ...base('ms-2-a'), type: 'milestone', projectId: 'proj-2', name: 'Deposit', percent: 60, amountCents: 7920000, dueDate: '2026-11-15', status: 'Invoiced', invoiceId: 'inv-3' },
  { ...base('ms-2-b'), type: 'milestone', projectId: 'proj-2', name: 'Delivery', percent: 30, amountCents: 3960000, dueDate: '2027-03-01', status: 'Pending' },
  { ...base('ms-2-c'), type: 'milestone', projectId: 'proj-2', name: 'Acceptance', percent: 10, amountCents: 1320000, dueDate: '2027-04-15', status: 'Pending' },
];

const pos: Dataset['po'] = [
  { ...base('po-1'), type: 'po', projectId: 'proj-1', accountId: 'acc-meridian', poNumber: 'PO-77310', amountCents: 4850000, date: '2026-07-22', documentId: 'doc-po-1' },
];

const invoices: Dataset['invoice'] = [
  { ...base('inv-1'), type: 'invoice', projectId: 'proj-1', accountId: 'acc-meridian', invoiceNumber: 'INV-2026-014', lines: [{ description: 'Deposit (60%)', amountCents: 2910000, milestoneId: 'ms-1-a' }], amountCents: 2910000, issuedDate: '2026-07-24', dueDate: '2026-08-23', paidDate: '2026-08-15', status: 'Paid', documentId: 'doc-invoice-1' },
  { ...base('inv-2'), type: 'invoice', projectId: 'proj-1', accountId: 'acc-meridian', invoiceNumber: 'INV-2026-021', lines: [{ description: 'Delivery (30%)', amountCents: 1455000, milestoneId: 'ms-1-b' }], amountCents: 1455000, issuedDate: '2026-09-10', dueDate: '2026-10-10', status: 'Sent' },
  { ...base('inv-3'), type: 'invoice', projectId: 'proj-2', accountId: 'acc-harbor', invoiceNumber: 'INV-2026-024', lines: [{ description: 'Deposit (60%)', amountCents: 7920000, milestoneId: 'ms-2-a' }], amountCents: 7920000, dueDate: '2026-11-15', status: 'Draft' },
];

// ---- Schedule ----------------------------------------------------------------------------------------------------

const si = (id: string, sortOrder: number, name: string, category: string, start: string, end: string, percentComplete: number, dependsOn: string[] = [], projectId = 'proj-1'): Dataset['scheduleItem'][number] => ({
  ...base(id), type: 'scheduleItem', projectId, name, category, start, end, dependsOn, percentComplete, sortOrder, owner: 'Grant',
});
const scheduleItems: Dataset['scheduleItem'] = [
  si('si-1', 1, 'Concept and specifications', 'Design', '2026-08-03', '2026-08-14', 100),
  si('si-2', 2, 'Detailed design', 'Design', '2026-08-17', '2026-09-22', 100, ['si-1']),
  si('si-3', 3, 'Order long-lead parts', 'Sourcing', '2026-09-23', '2026-10-02', 100, ['si-2']),
  si('si-4', 4, 'Fabrication and assembly', 'Build', '2026-10-05', '2026-11-27', 45, ['si-3']),
  si('si-5', 5, 'Controls wiring', 'Build', '2026-11-09', '2026-12-04', 0, ['si-3']),
  si('si-6', 6, 'Factory acceptance test', 'Build', '2026-12-07', '2026-12-09', 0, ['si-4', 'si-5']),
  si('si-7', 7, 'Site installation and acceptance', 'Install', '2026-12-14', '2026-12-18', 0, ['si-6']),
  si('si-p2-1', 1, 'Concept and specifications', 'Design', '2026-10-01', '2026-10-30', 70, [], 'proj-2'),
  si('si-p2-2', 2, 'Detailed design', 'Design', '2026-11-02', '2026-12-15', 0, ['si-p2-1'], 'proj-2'),
];
const baselines: Dataset['baseline'] = [
  {
    ...base('bl-1', '2026-07-24T12:00:00Z'), type: 'baseline', projectId: 'proj-1', name: 'Contract', takenAt: '2026-07-24T12:00:00Z',
    items: [
      { scheduleItemId: 'si-1', start: '2026-08-03', end: '2026-08-14', percentComplete: 0 },
      { scheduleItemId: 'si-2', start: '2026-08-17', end: '2026-09-11', percentComplete: 0 },
      { scheduleItemId: 'si-3', start: '2026-09-14', end: '2026-09-18', percentComplete: 0 },
      { scheduleItemId: 'si-4', start: '2026-09-21', end: '2026-11-13', percentComplete: 0 },
      { scheduleItemId: 'si-5', start: '2026-10-26', end: '2026-11-20', percentComplete: 0 },
      { scheduleItemId: 'si-6', start: '2026-11-23', end: '2026-11-25', percentComplete: 0 },
      { scheduleItemId: 'si-7', start: '2026-11-30', end: '2026-12-04', percentComplete: 0 },
    ],
  },
];

const sourcingItems: Dataset['sourcingItem'] = [
  { ...base('src-1'), type: 'sourcingItem', projectId: 'proj-1', description: 'Servo motor and drive', supplierAccountId: 'acc-vertex', quoteRequestedDate: '2026-08-20', quoteDocumentId: 'doc-supplier-1', priceCents: 184000, leadTimeDays: 28, status: 'Ordered', poNumber: 'BC-PO-0041' },
  { ...base('src-2'), type: 'sourcingItem', projectId: 'proj-1', description: 'Torque transducer', supplierAccountId: 'acc-vertex', quoteRequestedDate: '2026-08-20', priceCents: 96000, leadTimeDays: 21, status: 'Quoted' },
  { ...base('src-3'), type: 'sourcingItem', projectId: 'proj-1', description: 'Guarding panels', supplierAccountId: 'acc-ironline', status: 'To quote' },
  { ...base('src-4'), type: 'sourcingItem', projectId: 'proj-2', description: 'Granite inspection plate', supplierAccountId: 'acc-ironline', quoteRequestedDate: '2026-10-22', status: 'To quote' },
];

// ---- Calendar ----------------------------------------------------------------------------------------------------

const events: Dataset['event'] = [
  { ...base('ev-1'), type: 'event', kind: 'Supplier visit', title: 'Visit Vertex Motion Supply', start: '2026-10-27T14:00:00-05:00', end: '2026-10-27T15:30:00-05:00', allDay: false, location: 'Supplier plant', accountIds: ['acc-vertex'], contactIds: ['con-vertex-1'], projectId: 'proj-1', purpose: 'Confirm servo lead time', outcomeNotes: 'Lead time holds at four weeks. Drive ships with the motor.', photoDocumentIds: [] },
  { ...base('ev-2'), type: 'event', kind: 'Customer visit', title: 'Progress review at Meridian', start: '2026-10-30T10:00:00-05:00', end: '2026-10-30T11:30:00-05:00', allDay: false, location: 'Customer plant', accountIds: ['acc-meridian'], contactIds: ['con-meridian-1'], projectId: 'proj-1', purpose: 'Review build progress and the delivery invoice', photoDocumentIds: [] },
  { ...base('ev-3'), type: 'event', kind: 'Site measurement', title: 'Measure conveyor drive area', start: '2026-11-03T09:00:00-06:00', end: '2026-11-03T11:00:00-06:00', allDay: false, location: 'Customer plant', accountIds: ['acc-prairie'], contactIds: ['con-prairie-1'], opportunityId: 'opp-3', purpose: 'Panel clearances and cable runs', photoDocumentIds: [] },
  { ...base('ev-4'), type: 'event', kind: 'Trade show', title: 'Pack Expo, day 1', start: '2026-11-10T00:00:00-06:00', allDay: true, location: 'Convention center', accountIds: [], contactIds: [], tripId: 'trip-1', purpose: 'Meet suppliers and look for leads', photoDocumentIds: [] },
  { ...base('ev-5'), type: 'event', kind: 'Networking event', title: 'Association dinner', start: '2026-11-11T18:30:00-06:00', allDay: false, location: 'Hotel ballroom', accountIds: ['acc-plains'], contactIds: ['con-plains-1'], tripId: 'trip-1', photoDocumentIds: [] },
];
const trips: Dataset['trip'] = [
  { ...base('trip-1'), type: 'trip', name: 'Pack Expo week', startDate: '2026-11-09', endDate: '2026-11-12', travelNotes: 'Drive Monday morning. Hotel near the venue.', knowledgeItemIds: ['know-trip'] },
];

const expenses: Dataset['expense'] = [
  { ...base('exp-1'), type: 'expense', date: '2026-10-21', amountCents: 18450, vendor: 'Ironline Conveyor Parts', vendorAccountId: 'acc-ironline', category: 'Materials', projectId: 'proj-1', receiptDocumentId: 'doc-receipt-1', source: 'agent_email', reimbursable: false },
  { ...base('exp-2'), type: 'expense', date: '2026-10-27', amountCents: 6120, vendor: 'Fuel', category: 'Travel', projectId: null, source: 'manual', reimbursable: false },
  { ...base('exp-3'), type: 'expense', date: '2026-10-15', amountCents: 4900, vendor: 'Design software subscription', category: 'Software', projectId: null, source: 'manual', reimbursable: false },
  { ...base('exp-4'), type: 'expense', date: '2026-10-28', amountCents: 23000, vendor: 'Trade show registration', category: 'Marketing', projectId: null, source: 'manual', reimbursable: false },
];

// ---- Knowledge -------------------------------------------------------------------------------------------------

const k = (id: string, n: number, kind: Dataset['knowledgeItem'][number]['kind'], title: string, scope: Dataset['knowledgeItem'][number]['scope'], body: string, extra: Partial<Dataset['knowledgeItem'][number]> = {}): Dataset['knowledgeItem'][number] => ({
  ...base(id), type: 'knowledgeItem', number: `BC-K-${26000 + n}`, kind, title, scope, body, ...extra,
});
const knowledgeItems: Dataset['knowledgeItem'] = [
  k('know-research', 1, 'Application research', 'Cap torque measurement approaches', 'Company', 'Inline versus offline torque measurement. Offline gives better data; inline catches every cap.'),
  k('know-trip', 2, 'Trip plan', 'Pack Expo plan', 'Company', 'Priorities: servo suppliers, vision vendors, two customer meetings.', { trip: { startDate: '2026-11-09', endDate: '2026-11-12', locations: ['Convention center', 'Hotel'], itinerary: [{ date: '2026-11-10', text: 'Walk the automation hall' }, { date: '2026-11-11', text: 'Meet Vertex at their booth', accountId: 'acc-vertex' }] } }),
  k('know-article', 3, 'Article', 'Washdown conveyor design notes', 'Company', 'Saved notes on sloped frames and sealed bearings.', { sourceUrl: 'https://example.com/articles/washdown', summary: { text: 'Sloped frames and sealed bearings keep washdown conveyors cleanable.', byAssistant: true } }),
  k('know-config', 4, 'Configuration', 'Company assistant configuration', 'Company', 'Speak as Block Concepts. Address the reader as you. No emoji, no superlatives. Never name customers or suppliers in public text.'),
  k('know-glossary', 5, 'Glossary', 'Company glossary', 'Company', '**FAT**: factory acceptance test.\n**SAT**: site acceptance test.\n**RAD Index**: risk and complexity rating.'),
  k('know-standard', 6, 'Standard work', 'Site measurement', 'Company', '1. Confirm access and safety rules.\n2. Photograph the area.\n3. Measure clearances and note utilities.\n4. Record everything in the project folder.'),
  k('know-proj-config', 7, 'Configuration', 'Torque station project notes', 'Project', 'Meridian prefers email summaries on Fridays. Maintenance lead is the day-to-day contact.', { projectId: 'proj-1' }),
];

const shareLinks: Dataset['shareLink'] = [
  { ...base('sl-1', '2026-10-20T14:00:00Z'), type: 'shareLink', projectId: 'proj-1', scope: { type: 'view' }, documentIds: ['doc-manual-1', 'doc-spec-1'], expiresAt: '2026-12-31T23:59:00Z', revoked: false, lastUsedAt: '2026-10-22T09:12:00Z' },
];

const act = (id: string, about: { recordType: Dataset['activity'][number]['about']['recordType']; recordId: string }, kind: Dataset['activity'][number]['kind'], text: string, at: string, extra: Partial<Dataset['activity'][number]> = {}): Dataset['activity'][number] => ({ ...base(id, at), type: 'activity', about, kind, text, actor: 'grant', at, ...extra });
const activity: Dataset['activity'] = [
  act('act-1', { recordType: 'opportunity', recordId: 'opp-3' }, 'note', 'Called Sam. Wants the measurement done before the quote is revised.', '2026-10-22T15:30:00Z'),
  act('act-2', { recordType: 'scheduleItem', recordId: 'si-4' }, 'date_change', 'Fabrication end moved from 2026-11-13 to 2026-11-27.', '2026-10-05T13:00:00Z', { reason: 'Servo drive lead time added two weeks.' }),
  act('act-3', { recordType: 'project', recordId: 'proj-1' }, 'state_change', 'Stage changed from Design to Build.', '2026-10-05T12:00:00Z', { actor: 'system' }),
  act('act-4', { recordType: 'lead', recordId: 'lead-1' }, 'system', 'Lead created from the Contact form.', '2026-10-28T16:20:00Z', { actor: 'system' }),
];
const audit: Dataset['audit'] = [
  { ...base('aud-1', '2026-10-05T12:00:00Z'), type: 'audit', actor: 'grant', action: 'project.setStage', about: { recordType: 'project', recordId: 'proj-1' }, before: { stage: 'Design' }, after: { stage: 'Build' }, at: '2026-10-05T12:00:00Z' },
];

// ---- Registry ----------------------------------------------------------------------------------------------------

const numbered: { number: string; recordType: RegistryEntry['about'] extends infer A ? (A extends { recordType: infer T } ? T : never) : never; id: string }[] = [];
const collect = (kind: keyof typeof numberedTypes, list: { id: string; number: string }[]) => list.forEach((r) => numbered.push({ number: r.number, recordType: kind as never, id: r.id }));
collect('lead', leads); collect('opportunity', opportunities); collect('project', projects); collect('job', jobs);
collect('document', documents); collect('knowledgeItem', knowledgeItems); collect('template', templates);

const registry: Dataset['registry'] = [
  ...numbered.map((n): RegistryEntry => ({ ...base(`reg-${n.number}`), type: 'registry', number: n.number, registryType: n.number.split('-')[1] as RegistryEntry['registryType'], status: 'Issued', about: { recordType: n.recordType, recordId: n.id } })),
  { ...base('reg-void-1'), type: 'registry', number: 'BC-Q-26012', registryType: 'Q', status: 'Void', voidReason: 'Duplicate quote number issued by mistake.' },
];

export const fixtures: Dataset = {
  lead: leads, account: accounts, contact: contacts, opportunity: opportunities, project: projects, checklistItem: checklistItems, job: jobs,
  milestone: milestones, po: pos, invoice: invoices, event: events, trip: trips, scheduleItem: scheduleItems, baseline: baselines,
  sourcingItem: sourcingItems, expense: expenses, document: documents, knowledgeItem: knowledgeItems, template: templates,
  shareLink: shareLinks, activity, audit, registry,
};

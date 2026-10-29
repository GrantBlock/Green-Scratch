import { z } from 'zod';

/** Every state set in spec/data-model.md, and the transitions each allows. */
export const LeadStatus = z.enum(['New', 'Contacted', 'Qualified', 'Dismissed']);
export const OpportunityStatus = z.enum(['Open', 'Won', 'Lost']);
export const ProjectStage = z.enum(['Design', 'Build', 'Install', 'Closed']);
export const ChecklistStatus = z.enum(['Missing', 'Requested', 'Received', 'In review', 'Released']);
export const DocumentStatus = z.enum(['Draft', 'In review', 'Released', 'Superseded']);
/** Stored invoice states. "Overdue" is derived from the due date; see invoiceDisplayStatus in rules.ts. */
export const InvoiceStatus = z.enum(['Draft', 'Sent', 'Paid']);
export const InvoiceDisplayStatus = z.enum(['Draft', 'Sent', 'Overdue', 'Paid']);
export const MilestoneStatus = z.enum(['Pending', 'Invoiced', 'Paid']);
export const JobStatus = z.enum(['Not started', 'In progress', 'Complete']);
export const SourcingStatus = z.enum(['To quote', 'Quoted', 'Ordered', 'Received']);

type Machine = Record<string, readonly string[]>;

export const stateMachines = {
  lead: { New: ['Contacted', 'Qualified', 'Dismissed'], Contacted: ['Qualified', 'Dismissed'], Qualified: [], Dismissed: ['New'] },
  opportunity: { Open: ['Won', 'Lost'], Won: [], Lost: ['Open'] },
  project: { Design: ['Build'], Build: ['Install', 'Design'], Install: ['Closed', 'Build'], Closed: ['Install'] },
  checklistItem: { Missing: ['Requested', 'Received'], Requested: ['Received', 'Missing'], Received: ['In review', 'Released'], 'In review': ['Released', 'Received'], Released: ['In review'] },
  document: { Draft: ['In review', 'Released'], 'In review': ['Draft', 'Released'], Released: ['Superseded'], Superseded: [] },
  invoice: { Draft: ['Sent'], Sent: ['Paid'], Paid: [] },
  milestone: { Pending: ['Invoiced'], Invoiced: ['Paid', 'Pending'], Paid: [] },
  job: { 'Not started': ['In progress'], 'In progress': ['Complete', 'Not started'], Complete: ['In progress'] },
  sourcingItem: { 'To quote': ['Quoted'], Quoted: ['Ordered', 'To quote'], Ordered: ['Received'], Received: [] },
} as const satisfies Record<string, Machine>;
export type StateMachineName = keyof typeof stateMachines;

export function canTransition(machine: StateMachineName, from: string, to: string): boolean {
  const m = stateMachines[machine] as Machine;
  return (m[from] ?? []).includes(to);
}

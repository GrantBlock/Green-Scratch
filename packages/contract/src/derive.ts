import type { Dataset } from './dataset.ts';
import type { CalEvent, ChecklistItem, Invoice, Lead, Opportunity, Project } from './records.ts';
import { daysBetween, daysLate, invoiceDisplayStatus, projectCompleteness } from './rules.ts';

export interface TodayView {
  today: string;
  newLeads: Lead[];
  followUpsDue: Opportunity[];
  overdueInvoices: { invoice: Invoice; daysLate: number }[];
  /** Today's visits and events through the end of the week (next 7 days). */
  visits: CalEvent[];
  missingDocuments: { project: Project; item: ChecklistItem }[];
}

/** The Today screen. Computed from the data so the server and the mock agree. */
export function computeToday(ds: Dataset, today: string): TodayView {
  const live = <T extends { archived: boolean }>(x: T) => !x.archived;
  const activeProjects = ds.project.filter((p) => live(p) && p.stage !== 'Closed');
  return {
    today,
    newLeads: ds.lead.filter((l) => live(l) && l.status === 'New'),
    followUpsDue: ds.opportunity.filter((o) => live(o) && o.status === 'Open' && o.nextActionDue != null && o.nextActionDue <= today),
    overdueInvoices: ds.invoice
      .filter((i) => live(i) && invoiceDisplayStatus(i, today) === 'Overdue')
      .map((invoice) => ({ invoice, daysLate: daysLate(invoice, today) }))
      .sort((a, b) => b.daysLate - a.daysLate),
    visits: ds.event
      .filter((e) => live(e) && e.start.slice(0, 10) >= today && daysBetween(today, e.start.slice(0, 10)) <= 7)
      .sort((a, b) => a.start.localeCompare(b.start)),
    missingDocuments: activeProjects.flatMap((project) =>
      ds.checklistItem
        .filter((c) => c.projectId === project.id && c.required && c.status === 'Missing' && c.dueDate != null && c.dueDate <= today)
        .map((item) => ({ project, item }))),
  };
}

export interface ProjectView { project: Project; completeness: number }
export function projectView(ds: Dataset, project: Project): ProjectView {
  return { project, completeness: projectCompleteness(ds.checklistItem.filter((c) => c.projectId === project.id)) };
}

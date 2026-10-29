import { schemas } from '@bc/contract';
import type { Dataset } from '@bc/contract';
import type { Store } from './store.ts';

/** Read every record out of a store as a Dataset (tests and exports). */
export async function snapshotStore(store: Store): Promise<Dataset> {
  const out: Record<string, unknown[]> = {};
  for (const type of Object.keys(schemas)) out[type] = await store.list(type, { includeArchived: true });
  return out as unknown as Dataset;
}

/** Insert a whole dataset (fixtures, or the base data for a new deployment) into a store. */
export async function seedStore(store: Store, data: Record<string, unknown[]>): Promise<void> {
  const ops = Object.entries(data).flatMap(([type, rows]) => (rows as { id: string }[]).map((rec) => ({ kind: 'insert' as const, type, rec })));
  await store.apply(ops);
}

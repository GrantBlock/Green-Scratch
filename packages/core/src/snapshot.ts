import { schemas } from '@bc/contract';
import type { Dataset } from '@bc/contract';
import type { Store } from './store.ts';

/** Read every record out of a store as a Dataset (tests and exports). */
export async function snapshotStore(store: Store): Promise<Dataset> {
  const out: Record<string, unknown[]> = {};
  for (const type of Object.keys(schemas)) out[type] = await store.list(type, { includeArchived: true });
  return out as unknown as Dataset;
}

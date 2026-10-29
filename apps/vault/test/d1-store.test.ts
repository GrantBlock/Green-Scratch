import { runStoreConformance } from '@bc/core/testing';
import { D1Store } from '../src/d1-store.ts';
import { migratedDb } from '../src/testing-sqlite.ts';

runStoreConformance('sqlite (same SQL as D1)', async () => {
  const db = migratedDb();
  return { store: new D1Store(db), close: () => db.close() };
});

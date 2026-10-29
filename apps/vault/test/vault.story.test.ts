/** The whole proof-of-concept story against the real stack: D1Store (SQLite) + the real app + the Hub routes, with sign-in on. */
import { fixtures, FIXTURE_NOW } from '@bc/contract/fixtures';
import { createApp, createHubHandler, MemoryFiles, seedStore, snapshotStore } from '@bc/core';
import { combine, listen, registerStory } from '@bc/core/testing';
import type { Harness } from '@bc/core/testing';
import { D1Store } from '../src/d1-store.ts';
import { devAuthenticator } from '../src/auth.ts';
import { migratedDb } from '../src/testing-sqlite.ts';

export async function startVault(): Promise<Harness> {
  let now = FIXTURE_NOW;
  const db = migratedDb();
  const store = new D1Store(db);
  await seedStore(store, fixtures as unknown as Record<string, unknown[]>);
  const files = new MemoryFiles();
  for (const d of fixtures.document) if (d.file.storage === 'r2') await files.put(d.file.key, new TextEncoder().encode(`%PDF-1.4\n% ${d.title}\n`), 'application/pdf');
  const app = createApp({ store, files, clock: () => now, authenticate: devAuthenticator() });
  const server = await listen(combine(app.handle, createHubHandler(app.publicApi)));
  return { ...server, setNow: (iso) => { now = iso; }, dataset: () => snapshotStore(store), close: async () => { await server.close(); db.close(); } };
}

registerStory('vault on sqlite', startVault);

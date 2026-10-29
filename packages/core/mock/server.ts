/**
 * Mock API for the proof of concept: the real business logic (src/app.ts) over an in-memory store seeded from the fixtures,
 * with the Hub routes on the same port. UI and Hub sessions build against this.
 * Run: npm run mock   (http://localhost:8787, Vault under /api/v1, Hub under /hub)
 */
import { pathToFileURL } from 'node:url';
import { fixtures, FIXTURE_NOW } from '@bc/contract/fixtures';
import { createApp, createHubHandler, MemoryFiles, MemoryStore, snapshotStore } from '../src/index.ts';
import type { Harness } from '../src/testing/index.ts';
import { combine, listen } from '../src/testing/index.ts';

export interface Mock extends Harness { store: MemoryStore; files: MemoryFiles }

export async function startMock(opts: { port?: number; now?: string } = {}): Promise<Mock> {
  let now = opts.now ?? FIXTURE_NOW;
  const store = new MemoryStore(fixtures as unknown as Record<string, any[]>);
  const files = new MemoryFiles();
  // The fixtures describe stored documents; give each a tiny placeholder file so downloads work.
  for (const d of fixtures.document) if (d.file.storage === 'r2') await files.put(d.file.key, new TextEncoder().encode(`%PDF-1.4\n% mock file: ${d.title}\n`), 'application/pdf');
  const app = createApp({ store, files, clock: () => now });
  const server = await listen(combine(app.handle, createHubHandler(app.publicApi)), opts.port ?? 0);
  return { ...server, store, files, setNow: (iso) => { now = iso; }, dataset: () => snapshotStore(store) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const s = await startMock({ port: Number(process.env.PORT ?? 8787) });
  console.log(`Mock Vault API on ${s.url}/api/v1 and Hub routes on ${s.url}/hub (fixture date 2026-10-29). Data is in memory and resets on restart.`);
}

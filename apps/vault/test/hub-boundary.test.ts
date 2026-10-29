import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixtures, FIXTURE_NOW } from '@bc/contract/fixtures';
import { createApp, MemoryFiles, seedStore } from '@bc/core';
import { D1Store } from '../src/d1-store.ts';
import { migratedDb } from '../src/testing-sqlite.ts';

test('the object the Hub receives has exactly the six Hub methods and nothing else', async () => {
  const db = migratedDb();
  const store = new D1Store(db);
  const app = createApp({ store, files: new MemoryFiles(), clock: () => FIXTURE_NOW });
  assert.deepEqual(Object.keys(app.publicApi).sort(), ['acceptUpload', 'getLibraryEntry', 'getSharePage', 'listLibrary', 'readDocument', 'submitContact']);
  db.close();
});

test('Hub methods never return Vault-only data', async () => {
  const db = migratedDb();
  const store = new D1Store(db);
  await seedStore(store, fixtures as unknown as Record<string, unknown[]>);
  const files = new MemoryFiles();
  for (const d of fixtures.document) if (d.file.storage === 'r2') await files.put(d.file.key, new TextEncoder().encode('x'), 'application/pdf');
  const { publicApi } = createApp({ store, files, clock: () => FIXTURE_NOW });
  const lib = JSON.stringify(await publicApi.listLibrary());
  for (const secret of ['BC-Q-', 'BC-B-', 'contractValue', 'estimatedValue', 'acc-meridian', 'email', 'Meridian', 'PO-77310']) assert.ok(!lib.includes(secret), `library leaks ${secret}`);
  // A private document is unreachable by any scope without a valid link.
  assert.equal(await publicApi.readDocument({ library: true }, 'doc-po-1'), null);
  assert.equal(await publicApi.readDocument({ tokenHash: 'deadbeef' }, 'doc-manual-1'), null);
  db.close();
});

import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixtures, FIXTURE_NOW } from '@bc/contract/fixtures';
import { createApp, encodeError, MemoryFiles, MemoryStore } from '@bc/core';
import type { VaultPublicApi } from '@bc/contract';
import { listen } from '@bc/core/testing';
import { createHub } from '../src/worker.ts';
import type { HubDeps } from '../src/worker.ts';

const PUBLIC = join(fileURLToPath(new URL('..', import.meta.url)), 'public');
const TYPES: Record<string, string> = { '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain' };

/** Stands in for Workers static assets: files from the built public/ folder. */
export const assetsFromDisk = {
  async fetch(req: Request): Promise<Response> {
    const p = normalize(decodeURIComponent(new URL(req.url).pathname)).replace(/^(\.\.[/\\])+/, '');
    try {
      const body = await readFile(join(PUBLIC, p));
      return new Response(body, { headers: { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' } });
    } catch { return new Response('not found', { status: 404 }); }
  },
};

/** A real Vault (business logic over an in-memory store) behind the Hub's narrow interface. */
export async function makeVault() {
  let now = FIXTURE_NOW;
  const store = new MemoryStore(fixtures as unknown as Record<string, any[]>);
  const files = new MemoryFiles();
  for (const d of fixtures.document) if (d.file.storage === 'r2') await files.put(d.file.key, new TextEncoder().encode(`%PDF-1.4\n% ${d.title}\n`), 'application/pdf');
  const app = createApp({ store, files, clock: () => now });
  const vaultApi = (method: string, path: string, body?: unknown) => app.handle(new Request(`http://vault.test/api/v1${path}`, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })).then(async (r) => ({ status: r.status, json: (await r.json()) as any }));
  return { app, store, files, vaultApi, setNow: (iso: string) => { now = iso; } };
}

export async function startHub(extra: Partial<HubDeps> = {}) {
  const vault = await makeVault();
  const hub = createHub({ vault: vault.app.publicApi, assets: assetsFromDisk, ...extra });
  const server = await listen(hub);
  return { ...vault, hub, url: server.url, close: server.close };
}

/**
 * Behaves like the real service binding: an expected refusal arrives at the Hub as a plain Error with only its message,
 * after the Vault side has encoded it. Use it to prove the Hub still answers 409 and 403 and not 500.
 */
export function overRpc(api: VaultPublicApi): VaultPublicApi {
  const wrap = <A extends unknown[], R>(fn: (...a: A) => Promise<R>) => async (...a: A): Promise<R> => {
    try { return await fn(...a); } catch (e) { throw new Error(encodeError(e).message); }
  };
  return {
    submitContact: wrap(api.submitContact), listLibrary: wrap(api.listLibrary), getLibraryEntry: wrap(api.getLibraryEntry),
    getSharePage: wrap(api.getSharePage), readDocument: wrap(api.readDocument), acceptUpload: wrap(api.acceptUpload),
  };
}

/**
 * The only way the Hub can reach the Vault: a Cloudflare service binding to this class. It exposes exactly the six methods of
 * VaultPublicApi (see packages/contract/src/hub.ts) and nothing else. The Hub has no database or storage binding.
 */
import { WorkerEntrypoint } from 'cloudflare:workers';
import type { ContactSubmission, SharePage, PublicLibraryEntry, VaultPublicApi } from '@bc/contract';
import { encodeError } from '@bc/core';
import { buildApp } from './app.ts';
import type { Env } from './env.ts';

/** Run a call and turn expected refusals into errors that survive the service binding (see encodeError). */
async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); } catch (e) { throw encodeError(e); }
}

export class VaultPublic extends WorkerEntrypoint<Env> implements VaultPublicApi {
  private api() { return buildApp(this.env).publicApi; }
  submitContact(input: ContactSubmission) { return guard(() => this.api().submitContact(input)); }
  listLibrary() { return guard(() => this.api().listLibrary()); }
  getLibraryEntry(id: string): Promise<PublicLibraryEntry | null> { return guard(() => this.api().getLibraryEntry(id)); }
  getSharePage(tokenHash: string): Promise<SharePage | { error: 'expired' | 'revoked' | 'not_found' }> { return guard(() => this.api().getSharePage(tokenHash)); }
  readDocument(scope: Parameters<VaultPublicApi['readDocument']>[0], documentId: string) { return guard(() => this.api().readDocument(scope, documentId)); }
  acceptUpload(tokenHash: string, checklistItemId: string, file: Parameters<VaultPublicApi['acceptUpload']>[2]) { return guard(() => this.api().acceptUpload(tokenHash, checklistItemId, file)); }
}

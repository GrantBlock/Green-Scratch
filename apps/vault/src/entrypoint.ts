/**
 * The only way the Hub can reach the Vault: a Cloudflare service binding to this class. It exposes exactly the six methods of
 * VaultPublicApi (see packages/contract/src/hub.ts) and nothing else. The Hub has no database or storage binding.
 */
import { WorkerEntrypoint } from 'cloudflare:workers';
import type { ContactSubmission, SharePage, PublicLibraryEntry, VaultPublicApi } from '@bc/contract';
import { buildApp } from './app.ts';
import type { Env } from './env.ts';

export class VaultPublic extends WorkerEntrypoint<Env> implements VaultPublicApi {
  private api() { return buildApp(this.env).publicApi; }
  submitContact(input: ContactSubmission) { return this.api().submitContact(input); }
  listLibrary() { return this.api().listLibrary(); }
  getLibraryEntry(id: string): Promise<PublicLibraryEntry | null> { return this.api().getLibraryEntry(id); }
  getSharePage(tokenHash: string): ReturnType<VaultPublicApi['getSharePage']> { return this.api().getSharePage(tokenHash) as Promise<SharePage | { error: 'expired' | 'revoked' | 'not_found' }>; }
  readDocument(scope: Parameters<VaultPublicApi['readDocument']>[0], documentId: string) { return this.api().readDocument(scope, documentId); }
  acceptUpload(tokenHash: string, checklistItemId: string, file: Parameters<VaultPublicApi['acceptUpload']>[2]) { return this.api().acceptUpload(tokenHash, checklistItemId, file); }
}

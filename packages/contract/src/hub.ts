import { z } from 'zod';
import { Email, Id, IsoDate, IsoDateTime } from './common.ts';

/** What a visitor sends from Contact. Only the email is validated. */
export const ContactSubmission = z.object({
  name: z.string(),
  company: z.string().optional(),
  email: Email,
  phone: z.string().optional(),
  message: z.string(),
  sourceContext: z.object({ tool: z.string(), entryTitle: z.string().optional() }).optional(),
  attachment: z.object({ fileName: z.string(), contentBase64: z.string(), mimeType: z.string().optional() }).optional(),
});
export type ContactSubmission = z.infer<typeof ContactSubmission>;
export const ContactReceipt = z.object({ received: z.literal(true) });

/** A public Library entry: tab, item, then the entry itself. */
export const PublicLibraryEntry = z.object({
  id: Id,
  tab: z.string(),
  item: z.string(),
  title: z.string(),
  description: z.string(),
  whenToUse: z.string(),
  revision: z.number().int().min(1),
  revisions: z.array(z.object({ revision: z.number().int().min(1), releasedAt: IsoDateTime })).max(3),
  previewUrl: z.string().optional(),
  downloadPath: z.string(),
});
export type PublicLibraryEntry = z.infer<typeof PublicLibraryEntry>;
export const LibraryIndex = z.object({ entries: z.array(PublicLibraryEntry) });

/** What a customer sees on their project page. No registry numbers except `reference`, which Grant may choose to expose. */
export const SharePage = z.object({
  projectName: z.string(),
  reference: z.string().nullable(),
  expiresAt: IsoDateTime,
  folders: z.array(z.object({
    folder: z.string(),
    subfolder: z.string().optional(),
    documents: z.array(z.object({ id: Id, title: z.string(), kind: z.string(), revision: z.number().int(), sizeBytes: z.number().int().optional(), downloadPath: z.string() })),
  })),
  uploadSlots: z.array(z.object({ checklistItemId: Id, name: z.string(), folder: z.string(), requestedAt: IsoDate.optional() })),
});
export type SharePage = z.infer<typeof SharePage>;
export const ShareErrorCode = z.enum(['expired', 'revoked', 'not_found']);
export const UploadResult = z.object({ received: z.literal(true), checklistItemId: Id });

/**
 * The only interface the Hub may use to reach the Vault (a Cloudflare service binding). The Hub has no database or
 * file-storage binding of its own. Tokens are hashed by the Hub before they are sent.
 */
export interface VaultPublicApi {
  submitContact(input: ContactSubmission): Promise<z.infer<typeof ContactReceipt>>;
  listLibrary(): Promise<z.infer<typeof LibraryIndex>>;
  getLibraryEntry(id: string): Promise<PublicLibraryEntry | null>;
  getSharePage(tokenHash: string): Promise<SharePage | { error: z.infer<typeof ShareErrorCode> }>;
  readDocument(scope: { tokenHash: string } | { library: true }, documentId: string): Promise<{ fileName: string; mimeType: string; body: ReadableStream<Uint8Array> } | null>;
  acceptUpload(tokenHash: string, checklistItemId: string, file: { fileName: string; mimeType?: string; body: ReadableStream<Uint8Array> }): Promise<z.infer<typeof UploadResult> | { error: z.infer<typeof ShareErrorCode> }>;
}

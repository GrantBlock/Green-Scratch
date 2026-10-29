import type { FileStore } from '@bc/core';

/** Uploaded and released files in R2. */
export class R2Files implements FileStore {
  private bucket: R2Bucket;
  constructor(bucket: R2Bucket) { this.bucket = bucket; }
  async put(key: string, bytes: Uint8Array, mimeType?: string): Promise<void> {
    await this.bucket.put(key, bytes, { httpMetadata: mimeType ? { contentType: mimeType } : undefined });
  }
  async get(key: string): Promise<{ bytes: Uint8Array; mimeType?: string } | null> {
    const o = await this.bucket.get(key);
    if (!o) return null;
    return { bytes: new Uint8Array(await o.arrayBuffer()), mimeType: o.httpMetadata?.contentType };
  }
}

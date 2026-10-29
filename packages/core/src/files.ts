/** Where uploaded file bytes live. R2 in production; memory for tests and the mock. */
export interface FileStore {
  put(key: string, bytes: Uint8Array, mimeType?: string): Promise<void>;
  get(key: string): Promise<{ bytes: Uint8Array; mimeType?: string } | null>;
}

export class MemoryFiles implements FileStore {
  private m = new Map<string, { bytes: Uint8Array; mimeType?: string }>();
  async put(key: string, bytes: Uint8Array, mimeType?: string) { this.m.set(key, { bytes: bytes.slice(), mimeType }); }
  async get(key: string) { const f = this.m.get(key); return f ? { bytes: f.bytes.slice(), mimeType: f.mimeType } : null; }
  has(key: string) { return this.m.has(key); }
}

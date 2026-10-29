import type { Dataset } from '@bc/contract';

/** What the shared tests need from a running server, whatever store is behind it. */
export interface Harness {
  url: string;
  close(): Promise<void>;
  /** Move the server's clock. */
  setNow(iso: string): void;
  /** Everything stored, for end-of-story validation. */
  dataset(): Promise<Dataset>;
}

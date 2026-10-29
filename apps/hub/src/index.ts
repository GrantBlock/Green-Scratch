/** Concepts Hub Worker entry. Bindings: VAULT (service binding to the Vault's VaultPublic entrypoint) and ASSETS (static files). */
import type { VaultPublicApi } from '@bc/contract';
import { createHub } from './worker.ts';

export interface Env {
  /** Service binding to bc-vault, entrypoint VaultPublic. The only way the Hub reaches the Vault. */
  VAULT: unknown;
  ASSETS: Fetcher;
  /** Turnstile (optional). When both are set, the Contact form requires the check. */
  TURNSTILE_SECRET?: string;
  TURNSTILE_SITE_KEY?: string;
  /** "true" once the Hub is released and may be indexed. */
  INDEXABLE?: string;
}

export default {
  fetch(req: Request, env: Env): Promise<Response> {
    return createHub({
      vault: env.VAULT as VaultPublicApi,
      assets: env.ASSETS,
      turnstile: env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY ? { secret: env.TURNSTILE_SECRET, siteKey: env.TURNSTILE_SITE_KEY } : undefined,
      indexable: env.INDEXABLE === 'true',
    })(req);
  },
} satisfies ExportedHandler<Env>;

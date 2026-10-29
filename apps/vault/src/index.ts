/**
 * Concepts Vault Worker. Serves the Vault API at /api/v1 behind Cloudflare Access.
 * The Hub reaches the Vault only through the VaultPublic entrypoint below (a service binding), never over HTTP.
 */
import type { Env } from './env.ts';
import { buildApp } from './app.ts';

export { VaultPublic } from './entrypoint.ts';
export type { Env } from './env.ts';

const SECURITY_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'x-frame-options': 'DENY',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'x-robots-tag': 'noindex, nofollow',
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const res = await buildApp(env).handle(req);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
    return out;
  },
} satisfies ExportedHandler<Env>;

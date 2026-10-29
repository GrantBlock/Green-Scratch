/**
 * The Hub, as a plain fetch handler so it runs on Workers and in Node tests. It knows nothing about the Vault except the six
 * methods of VaultPublicApi. It has no database, no file storage and no Vault session.
 */
import { createHubHandler } from '@bc/core';
import type { VaultPublicApi } from '@bc/contract';
import { CUSTOMER_PAGE, CUSTOMER_PATH, renderPage, STATIC_PAGES } from './pages.ts';

export interface HubDeps {
  vault: VaultPublicApi;
  /** Serves /assets/* and /robots.txt (Workers static assets, or a folder in tests). */
  assets: { fetch(req: Request): Promise<Response> };
  /** Show a Turnstile check on the Contact form and require it. Optional; off until keys are set. */
  turnstile?: { secret: string; siteKey: string; fetchImpl?: typeof fetch };
  /** Let search engines index the Hub. Off until the Hub is released. */
  indexable?: boolean;
}

const MAX_CONTACT_BYTES = 8 * 1024 * 1024; // 5 MB file, base64-encoded, plus the text
const LIMITS: Record<string, number> = { name: 200, company: 200, email: 254, phone: 60, message: 10_000 };

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const err = (status: number, code: string, message: string, fields?: Record<string, string>) => json(status, { error: { code, message, fields } });

export function createHub(deps: HubDeps): (req: Request) => Promise<Response> {
  const api = createHubHandler(deps.vault);
  const indexable = deps.indexable === true;

  const csp = [
    "default-src 'none'",
    `script-src 'self'${deps.turnstile ? ' https://challenges.cloudflare.com' : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    ...(deps.turnstile ? ['frame-src https://challenges.cloudflare.com'] : []),
  ].join('; ');

  /** Headers every response carries. Customer links and their data are never cached or indexed. */
  const secure = (res: Response, path: string): Response => {
    const out = new Response(res.body, res);
    const private_ = path.startsWith('/p/') || path.startsWith('/hub/p/') || path.startsWith('/hub/api/contact');
    out.headers.set('content-security-policy', csp);
    out.headers.set('x-content-type-options', 'nosniff');
    out.headers.set('x-frame-options', 'DENY');
    out.headers.set('referrer-policy', 'no-referrer');
    out.headers.set('strict-transport-security', 'max-age=31536000');
    out.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
    if (private_ || path.startsWith('/hub/')) out.headers.set('cache-control', 'no-store');
    if (private_ || !indexable) out.headers.set('x-robots-tag', 'noindex, nofollow');
    return out;
  };

  async function contact(req: Request): Promise<Response> {
    const declared = Number(req.headers.get('content-length') ?? 0);
    if (declared > MAX_CONTACT_BYTES) return err(413, 'validation_failed', 'That message is too large. Send a smaller file.');
    const raw = new Uint8Array(await req.arrayBuffer());
    if (raw.length > MAX_CONTACT_BYTES) return err(413, 'validation_failed', 'That message is too large. Send a smaller file.');
    let body: Record<string, unknown>;
    try { body = JSON.parse(new TextDecoder().decode(raw)); } catch { return err(400, 'validation_failed', 'The request body is not valid JSON.'); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return err(400, 'validation_failed', 'The request body is not valid.');

    // Honeypot: a hidden field only automated fillers complete. Say "received" and drop it.
    if (typeof body.website === 'string' && body.website.trim() !== '') return json(200, { received: true });
    delete body.website;

    const fields: Record<string, string> = {};
    for (const [k, max] of Object.entries(LIMITS)) if (typeof body[k] === 'string' && (body[k] as string).length > max) fields[k] = `Keep this under ${max.toLocaleString('en-US')} characters.`;
    if (Object.keys(fields).length) return err(400, 'validation_failed', 'Check the form and try again.', fields);

    if (deps.turnstile) {
      const token = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';
      delete body.turnstileToken;
      const ok = token && (await (async () => {
        try {
          const r = await (deps.turnstile!.fetchImpl ?? fetch)('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ secret: deps.turnstile!.secret, response: token }) });
          return ((await r.json()) as { success?: boolean }).success === true;
        } catch { return false; }
      })());
      if (!ok) return err(400, 'validation_failed', 'Complete the check and try again.');
    }
    return api(new Request(req.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
  }

  return async (req) => {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const done = (res: Response) => secure(res, path);

    // API: the Hub routes from the contract, and nothing else.
    if (path.startsWith('/hub/')) {
      if (method === 'POST' && path === '/hub/api/contact') return done(await contact(req));
      if (method === 'GET' || method === 'POST') return done(await api(req));
      return done(err(405, 'forbidden', 'That method is not allowed here.'));
    }

    // Pages.
    const spec = STATIC_PAGES[path] ?? (CUSTOMER_PATH.test(path) ? CUSTOMER_PAGE : undefined);
    if (spec) {
      if (method !== 'GET' && method !== 'HEAD') return done(err(405, 'forbidden', 'That method is not allowed here.'));
      const html = renderPage(spec, { indexable: indexable && !path.startsWith('/p/') });
      return done(new Response(method === 'HEAD' ? null : html, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
    }

    // Static files.
    if (path.startsWith('/assets/') || path === '/robots.txt') {
      if (method !== 'GET' && method !== 'HEAD') return done(err(405, 'forbidden', 'That method is not allowed here.'));
      const res = await deps.assets.fetch(req);
      const out = new Response(res.body, res);
      if (res.ok) out.headers.set('cache-control', path === '/robots.txt' ? 'public, max-age=3600' : 'public, max-age=3600');
      return done(out);
    }

    return done(err(404, 'not_found', 'That page was not found.'));
  };
}

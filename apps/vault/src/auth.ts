/**
 * Sign-in for the Vault. Cloudflare Access sits in front of the address and adds a signed token to every request;
 * this checks that token (signature, audience, issuer, expiry) and that the email is the one allowed address.
 * Anything else is refused. If nothing is configured, nothing gets in.
 */
export interface AccessConfig {
  teamDomain: string;
  audience: string;
  allowedEmail: string;
  /** For tests. Defaults to fetching Cloudflare's published keys. */
  fetchKeys?: (url: string) => Promise<{ keys: (JsonWebKey & { kid?: string })[] }>;
  /** Seconds since epoch. For tests. */
  nowSeconds?: () => number;
}

type Keys = { keys: (JsonWebKey & { kid?: string })[] };
let cache: { url: string; at: number; keys: Keys } | null = null;
const KEY_TTL_MS = 60 * 60 * 1000;

const b64urlToBytes = (s: string): Uint8Array => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '='));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
const b64urlJson = (s: string) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

export function accessAuthenticator(cfg: AccessConfig): (req: Request) => Promise<{ email: string } | null> {
  const certsUrl = `https://${cfg.teamDomain}/cdn-cgi/access/certs`;
  const fetchKeys = cfg.fetchKeys ?? (async (url: string) => (await fetch(url)).json() as Promise<Keys>);
  const nowSeconds = cfg.nowSeconds ?? (() => Math.floor(Date.now() / 1000));

  const keysFor = async (kid: string): Promise<(JsonWebKey & { kid?: string }) | undefined> => {
    for (const force of [false, true]) {
      if (force || !cache || cache.url !== certsUrl || Date.now() - cache.at > KEY_TTL_MS) cache = { url: certsUrl, at: Date.now(), keys: await fetchKeys(certsUrl) };
      const k = cache.keys.keys.find((x) => x.kid === kid);
      if (k) return k;
    }
    return undefined;
  };

  return async (req) => {
    const token = req.headers.get('cf-access-jwt-assertion') ?? /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(req.headers.get('cookie') ?? '')?.[1];
    if (!token) return null;
    try {
      const [h, p, s] = token.split('.');
      if (!h || !p || !s) return null;
      const header = b64urlJson(h);
      if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;
      const jwk = await keysFor(header.kid);
      if (!jwk) return null;
      const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(s) as BufferSource, new TextEncoder().encode(`${h}.${p}`));
      if (!ok) return null;
      const claims = b64urlJson(p);
      const now = nowSeconds();
      const aud: string[] = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
      if (!aud.includes(cfg.audience)) return null;
      if (claims.iss !== `https://${cfg.teamDomain}`) return null;
      if (typeof claims.exp !== 'number' || claims.exp <= now) return null;
      if (typeof claims.nbf === 'number' && claims.nbf > now + 60) return null;
      const email = typeof claims.email === 'string' ? claims.email.toLowerCase() : '';
      if (!email || email !== cfg.allowedEmail.toLowerCase()) return null;
      return { email };
    } catch {
      return null;
    }
  };
}

/** Local development only: lets requests through, but only when the request itself is to localhost. */
export function devAuthenticator(): (req: Request) => Promise<{ email: string } | null> {
  return async (req) => {
    const host = new URL(req.url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' ? { email: 'dev@localhost' } : null;
  };
}

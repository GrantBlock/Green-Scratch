import { createApp } from '@bc/core';
import type { Assistant } from '@bc/core';
import { accessAuthenticator, devAuthenticator } from './auth.ts';
import { D1Store } from './d1-store.ts';
import type { Env } from './env.ts';
import { assistantFromEnv } from './assistant-config.ts';
import { R2Files } from './r2-files.ts';
import { D1Db } from './sql.ts';

/** Wire the shared business logic to Cloudflare: D1 for records, R2 for files, Access for sign-in. */
export function buildApp(env: Env, assistant?: Assistant) {
  let authenticate: ((req: Request) => Promise<{ email: string } | null>) | undefined;
  if (env.DEV_AUTH === 'true') authenticate = devAuthenticator();
  else if (env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD && env.ALLOWED_EMAIL) authenticate = accessAuthenticator({ teamDomain: env.ACCESS_TEAM_DOMAIN, audience: env.ACCESS_AUD, allowedEmail: env.ALLOWED_EMAIL });
  else authenticate = async () => { console.error('Sign-in is not configured: set ACCESS_TEAM_DOMAIN, ACCESS_AUD and ALLOWED_EMAIL.'); return null; };
  return createApp({
    store: new D1Store(new D1Db(env.DB)),
    files: new R2Files(env.FILES),
    clock: () => new Date().toISOString(),
    timeZone: env.TIME_ZONE ?? 'America/Chicago',
    authenticate,
    assistant: assistant ?? assistantFromEnv(env),
  });
}

/** Bindings and settings the Vault Worker expects. See wrangler.jsonc and docs/DEPLOY.md. */
export interface Env {
  /** D1 database: all records. */
  DB: D1Database;
  /** R2 bucket: uploaded and released files. */
  FILES: R2Bucket;
  /** IANA time zone for "today". Default America/Chicago. */
  TIME_ZONE?: string;
  /** Cloudflare Access team domain, for example myteam.cloudflareaccess.com */
  ACCESS_TEAM_DOMAIN?: string;
  /** Cloudflare Access application audience (AUD) tag. */
  ACCESS_AUD?: string;
  /** The one email address allowed in. */
  ALLOWED_EMAIL?: string;
  /** Set to "true" for local development only. Honored only on localhost. */
  DEV_AUTH?: string;
  /** Secret. Without it the Assistant falls back to a plain word match and says so. Set with `wrangler secret put ANTHROPIC_API_KEY`. */
  ANTHROPIC_API_KEY?: string;
  /** Model for the Assistant. Default claude-opus-5-5. The monthly cap and the price table in packages/assistant assume the model named here. */
  ASSISTANT_MODEL?: string;
  /** Monthly spend cap in cents. Default 2000 ($20). */
  ASSISTANT_MONTHLY_CAP_CENTS?: string;
  /** Local development only: send Assistant calls to a test server instead of Anthropic. Ignored unless DEV_AUTH is "true". */
  ANTHROPIC_BASE_URL?: string;
}

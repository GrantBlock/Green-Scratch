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
}

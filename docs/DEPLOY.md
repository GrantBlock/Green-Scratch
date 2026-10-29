# Deploying the Concepts Vault

One-time setup for `vault.blockconceptsllc.com`. Everything here needs your Cloudflare account, so it is yours to run (or to approve me running). Nothing in the repo deploys by itself yet.

The Vault is a Cloudflare Worker (`apps/vault`) with a D1 database for records and an R2 bucket for files. Sign-in is Cloudflare Access: you enter your email, Cloudflare emails a one-time code, and the Worker accepts only that one address.

## What you need first

- The `blockconceptsllc.com` domain on Cloudflare (it already is, for the website).
- Node 22 and `npm install` run once at the top of this repo.
- A Cloudflare plan that includes Workers, D1 and R2. **Check current pricing and limits on Cloudflare's site before relying on them.** Access (Zero Trust) has a free tier for small teams; confirm that too.

## Steps

Run these from `apps/vault`. Commands start with `npx wrangler`.

1. **Sign in:** `npx wrangler login`
2. **Create the database:** `npx wrangler d1 create bc-vault`. Copy the `database_id` it prints into `wrangler.jsonc` (replacing `REPLACE_WITH_DATABASE_ID_FROM_wrangler_d1_create`).
3. **Create the file bucket:** `npx wrangler r2 bucket create bc-vault-files`
4. **Create the tables:** `npx wrangler d1 migrations apply bc-vault --remote`
5. **Load the base data** (three templates, Block Concepts' own account, their Registry numbers): `npx wrangler d1 execute bc-vault --remote --file=seed/base.sql`. Never run `seed/dev.sql` here; it is fictional example data for local work.
6. **Set up sign-in** in the Cloudflare dashboard, Zero Trust:
   1. Create a Zero Trust organization if you have none (it asks for a team name; that gives `<team>.cloudflareaccess.com`).
   2. Authentication: make sure **One-time PIN** is enabled.
   3. Access, Applications, Add, **Self-hosted**: name `Concepts Vault`, domain `vault.blockconceptsllc.com`, session 24 hours.
   4. Policy: **Allow**, include **Emails** and enter your address only.
   5. Save, then open the application and copy its **Application Audience (AUD) tag**.
7. **Put the sign-in details in `wrangler.jsonc`** under `vars`: `ACCESS_TEAM_DOMAIN` (your `<team>.cloudflareaccess.com`), `ACCESS_AUD` (the tag from step 6), `ALLOWED_EMAIL` (your address). They are not secrets.
8. **Turn on the address:** uncomment the `routes` line in `wrangler.jsonc` (a Cloudflare custom domain creates the DNS record for you).
9. **Deploy:** `npx wrangler deploy`
10. **Check:** open `https://vault.blockconceptsllc.com/api/v1/health` in your browser. You should be asked for your email, then a code, then see `{"ok":true,...}`. Any other email must be refused.

If the Worker is up but Access is not configured, every request is refused (it fails closed), and the log says what is missing.

## Backups

- D1 keeps point-in-time history (Time Travel); check how long your plan keeps it.
- Export on demand: `npx wrangler d1 export bc-vault --remote --output backup.sql`. File bytes in R2 need their own copy; a scheduled export is a later task.

## Local development (no Cloudflare account needed)

```
cd apps/vault
npx wrangler d1 migrations apply bc-vault --local
npx wrangler d1 execute bc-vault --local --file=seed/dev.sql
npx wrangler dev --local --var DEV_AUTH:true
```

`DEV_AUTH` only lets requests through when the address is `localhost`; on any other host the Worker still refuses everything.

## Not set up yet

- **The Hub** (`hub.blockconceptsllc.com`) is a separate Worker (track C3). It will call the Vault only through the `VaultPublic` service binding, never over HTTP.
- **Deploy on push to `main`** (Cloudflare Workers Builds or a GitHub action) comes after the first manual deploy works.
- **The Anthropic key** for the real Assistant (track C4).

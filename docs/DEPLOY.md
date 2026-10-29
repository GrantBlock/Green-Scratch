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

## Deploying the Hub (`hub.blockconceptsllc.com`)

Do this after the Vault is deployed: the Hub's service binding needs the `bc-vault` Worker to exist.

1. From `apps/hub`: `npm run build:assets`, then `npx wrangler deploy`. (The first deploy creates the `bc-hub` Worker bound to `bc-vault`'s `VaultPublic` entrypoint.)
2. Uncomment the `routes` line in `apps/hub/wrangler.jsonc` (custom domain `hub.blockconceptsllc.com`) and deploy again.
3. **No sign-in on the Hub.** Do not put Cloudflare Access in front of it; customers use it. Customer pages are protected by long random links, expiry and revocation.
4. **Rate limiting (do this before sharing the address).** In the Cloudflare dashboard for `blockconceptsllc.com`, Security, WAF, Rate limiting rules: create a rule for requests to `hub.blockconceptsllc.com` where the path is `/hub/api/contact` or starts with `/hub/p/`, limited per IP (for example 10 requests per minute), action Block. Check which rule types your plan includes.
5. **Spam check (optional, recommended once the address is public).** Create a Turnstile widget for `hub.blockconceptsllc.com`, then set `TURNSTILE_SITE_KEY` as a variable and `TURNSTILE_SECRET` as a secret (`npx wrangler secret put TURNSTILE_SECRET`). The Contact form then requires the check. (The page script for the check widget is not written yet; do not turn this on until it is.)
6. **Indexing.** The Hub is blocked from search engines (noindex and `robots.txt`) until you set `INDEXABLE` to `true`. Leave it off until the Hub is released and the main website links to it. Customer pages are never indexed.
7. **Check:** open `https://hub.blockconceptsllc.com/`, send a test message from Contact, and confirm the lead appears in the Vault. Then create a customer link in the Vault and open it in a private window.

### Running both locally under Cloudflare's runtime

```
cd apps/vault && npx wrangler d1 migrations apply bc-vault --local --persist-to /tmp/bcstate
cd apps/vault && npx wrangler d1 execute bc-vault --local --persist-to /tmp/bcstate --file=seed/dev.sql
cd apps/hub && npm run build:assets
cd ../.. && npx wrangler dev -c apps/hub/wrangler.jsonc -c apps/vault/wrangler.jsonc --persist-to /tmp/bcstate --port 8790
```

The first `-c` file is the Worker you browse (the Hub); the Vault runs beside it and is reachable only through the binding.

## Turning on the Assistant (after the Vault is deployed)

Without a key the Assistant is off: the Vault answers with a plain word match that says "not set up yet", and nothing is spent.

1. Create an API key in the Anthropic Console for this use only, with a spend limit on the key or the workspace if the Console offers one. (A limit there is a second safety net behind the Vault's own cap.)
2. From `apps/vault`: `npx wrangler secret put ANTHROPIC_API_KEY` and paste the key. It is a secret: never put it in `wrangler.jsonc`.
3. Choose the model and the cap in `apps/vault/wrangler.jsonc` under `vars`, then `npx wrangler deploy`:
   - `ASSISTANT_MODEL` defaults to `claude-opus-5-5`. Cheaper models cost less per question but may answer less well; see the table in `spec/assistant-spec.md`. Whether the cheaper ones are good enough for your questions is for you to judge from real answers.
   - `ASSISTANT_MONTHLY_CAP_CENTS` is `2000` ($20). Raise it to `6000` when you want $60.
4. **Before relying on it, run the live check once** from `packages/assistant` on your machine: `ANTHROPIC_API_KEY=... CONFIRM_SPEND=yes npm run live`. It asks three real questions over the example data, costs a few cents, and prints the answers and what each cost. Read the answers: the script checks structure, not quality.
5. After a few days, read what it really spends: `GET /api/v1/audit?action=assistant.usage` (each event has the token counts and `costCents`). Compare with the estimates in the spec and adjust the cap.

Refusal fallback is on by default (a safety-classifier decline is retried on another model). If you do not want that, say so and it is one line to remove.

## Not set up yet

- **Deploy on push to `main`** (Cloudflare Workers Builds or a GitHub action) comes after the first manual deploys work.
- **Malware scanning** of customer uploads.
- **The public Assistant** (a separate limited tool; it will not use the Vault's key, code or data).

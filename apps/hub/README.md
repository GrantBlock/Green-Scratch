# @bc/hub

The Concepts Hub: the customer-accessible Cloudflare Worker for `hub.blockconceptsllc.com`. It serves the public pages and the customer project pages, and it has **no database and no file storage**. It reaches the Vault only through one service binding to the `VaultPublic` entrypoint (six methods).

## Pages

| Address | What |
|---|---|
| `/` | Hub home: the tools |
| `/contact` | Contact form. Only the email is validated. Optional file up to 5 MB. Creates a lead in the Vault |
| `/library` | Public documents, in tabs and topics, with download |
| `/p/<token>` | A customer's project page, from an expiring link: released documents to download and files they were asked for to send. No navigation to anything else |

Not built yet: Builder and the public Assistant (they come after the proof of concept). Pages are built from the design-system components in `design/system`; when the H1 mockups arrive they get restyled by composition, not by new CSS.

## Parts

| File | What |
|---|---|
| `src/worker.ts` | The Hub as a plain fetch handler: routing, security headers, Contact guards (size, length, honeypot, optional Turnstile) |
| `src/pages.ts` | HTML shells; each loads the design system, React 18 and one page script |
| `src/client/*.tsx` | The page scripts. They use `window.React` and `window.BlockConcepts`; `react-global.ts` makes sure there is only one React |
| `src/index.ts` | Worker entry: wires the `VAULT` and `ASSETS` bindings |
| `scripts/build-assets.ts` | Copies the design system and React into `public/` and bundles the page scripts. `public/` is generated |
| `wrangler.jsonc` | Two bindings only: `VAULT` and `ASSETS` |

## Commands

```
npm test              # builds assets, then: handler tests, boundary tests, real-browser tests (phone, iPad, desktop)
npm run typecheck
npm run build:check   # bundle exactly as a deploy would (no upload)
npm run dev           # local; see docs/DEPLOY.md for running with the Vault
```

The browser tests use Playwright and Chromium from the environment and are skipped if they are missing. Set `SHOT_DIR` to save screenshots.

## Rules

1. The boundary is enforced by tests: no database, storage or other data binding in `wrangler.jsonc`, and the only import from `@bc/core` is `createHubHandler`.
2. No inline scripts; the Content Security Policy allows scripts from the Hub itself only (plus Turnstile, only when it is switched on).
3. Never show a Registry number to a customer. Customer pages and data are never cached or indexed.
4. No colors, fonts or spacing of our own: `hub.css` uses design-system tokens only.
5. An expected refusal (409, 403, 413, 400) must stay a refusal across the service binding. The Vault side encodes it; `createHubHandler` decodes it.

## Known gaps

- The Library has no first-page preview image and no older-revision download (the Vault interface does not offer them yet).
- No per-visitor rate limit inside the Worker: use the Cloudflare rule in `docs/DEPLOY.md`.
- Uploaded files are stored as received (private, size-limited). They are not scanned for malware.

/** The HTML shells. Each loads the design system, React 18 and one page script that draws the page. */
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export interface PageSpec { title: string; script: 'home' | 'contact' | 'library' | 'customer' }

export const STATIC_PAGES: Record<string, PageSpec> = {
  '/': { title: 'Concepts Hub', script: 'home' },
  '/contact': { title: 'Contact | Concepts Hub', script: 'contact' },
  '/library': { title: 'Library | Concepts Hub', script: 'library' },
};
export const CUSTOMER_PAGE: PageSpec = { title: 'Your project documents', script: 'customer' };
/** A customer link: /p/<token>. Tokens are long random strings. */
export const CUSTOMER_PATH = /^\/p\/[A-Za-z0-9_-]{10,128}$/;

export function renderPage(spec: PageSpec, opts: { indexable: boolean }): string {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(spec.title)}</title>
${opts.indexable ? '' : '<meta name="robots" content="noindex, nofollow">'}
<meta name="referrer" content="no-referrer">
<link rel="icon" href="/assets/ds/Favicons/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/ds/Favicons/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/ds/tokens.css">
<link rel="stylesheet" href="/assets/ds/components/bundle.css">
<link rel="stylesheet" href="/assets/hub/hub.css">
</head>
<body>
<div id="root"></div>
<noscript><p style="padding:1rem">This page needs JavaScript. Turn it on, or contact Block Concepts directly.</p></noscript>
<script src="/assets/vendor/react.js"></script>
<script src="/assets/vendor/react-dom.js"></script>
<script src="/assets/ds/components/bundle.js"></script>
<script src="/assets/hub/${spec.script}.js"></script>
</body>
</html>`;
}

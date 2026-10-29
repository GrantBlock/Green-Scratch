/// <reference path="./ds.d.ts" />
/** Shared page frame: the Hub header, footer and a few helpers. Components come from the design system, never redefined here. */
const DS = window.BlockConcepts;

export const MAIN_SITE = 'https://blockconceptsllc.com';

export function Header({ current }: { current?: 'contact' | 'library' }) {
  return (
    <DS.NavBar
      homeHref="/"
      tagline="Concepts Hub"
      links={[
        { label: 'Contact', href: '/contact', current: current === 'contact' },
        { label: 'Library', href: '/library', current: current === 'library' },
        { label: 'Main site', href: MAIN_SITE },
      ]}
    />
  );
}

export function PageFooter() {
  return (
    <DS.Footer
      links={[{ label: 'Main site', href: MAIN_SITE }, { label: 'Contact', href: '/contact' }, { label: 'Library', href: '/library' }]}
      legal={[{ label: 'Privacy', href: `${MAIN_SITE}/privacy/` }, { label: 'Terms', href: `${MAIN_SITE}/terms/` }]}
    />
  );
}

export function Page({ current, children }: { current?: 'contact' | 'library'; children: React.ReactNode }) {
  return (
    <>
      <Header current={current} />
      <main id="main" className="hub-main">{children}</main>
      <PageFooter />
    </>
  );
}

export const mount = (el: React.ReactElement) => {
  const root = document.getElementById('root');
  if (root) (window as unknown as { ReactDOM: { createRoot(e: Element): { render(x: React.ReactElement): void } } }).ReactDOM.createRoot(root).render(el);
};

export async function getJson<T>(path: string): Promise<{ ok: boolean; status: number; body: T }> {
  const r = await fetch(path, { headers: { accept: 'application/json' } });
  return { ok: r.ok, status: r.status, body: (await r.json().catch(() => ({}))) as T };
}

export const prettyFolder = (f: string) => f.replace(/ - (Project|Customer)$/, '');
export const formatBytes = (n?: number) => (n == null ? '' : n < 1024 ? `${n} B` : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`);
export const formatDate = (iso: string) => new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso));

/**
 * Builds public/assets: the design system (tokens, component bundle, fonts, logos, patterns), React 18 (the component
 * bundle expects window.React), and the Hub's own page scripts. public/ is generated; do not edit it.
 */
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const ds = join(root, '../../design/system');
const out = join(root, 'public/assets');
const require = createRequire(import.meta.url);

rmSync(join(root, 'public'), { recursive: true, force: true });
mkdirSync(join(out, 'ds/components'), { recursive: true });
mkdirSync(join(out, 'vendor'), { recursive: true });

// Design system: only what the Hub serves. Fonts sit beside tokens.css because it refers to them by relative path.
cpSync(join(ds, 'tokens.css'), join(out, 'ds/tokens.css'));
cpSync(join(ds, 'components/bundle.css'), join(out, 'ds/components/bundle.css'));
cpSync(join(ds, 'components/bundle.js'), join(out, 'ds/components/bundle.js'));
cpSync(join(ds, 'fonts'), join(out, 'ds/fonts'), { recursive: true });
cpSync(join(ds, 'assets/Logos'), join(out, 'ds/Logos'), { recursive: true });
cpSync(join(ds, 'assets/Patterns'), join(out, 'ds/Patterns'), { recursive: true });
cpSync(join(ds, 'assets/Favicons'), join(out, 'ds/Favicons'), { recursive: true });

// React 18 UMD builds, self-hosted.
const reactDir = dirname(require.resolve('react/package.json'));
const domDir = dirname(require.resolve('react-dom/package.json'));
cpSync(join(reactDir, 'umd/react.production.min.js'), join(out, 'vendor/react.js'));
cpSync(join(domDir, 'umd/react-dom.production.min.js'), join(out, 'vendor/react-dom.js'));

// Hub pages. React comes from the window; the design system components come from window.BlockConcepts.
await build({
  entryPoints: {
    home: join(root, 'src/client/home.tsx'),
    contact: join(root, 'src/client/contact.tsx'),
    library: join(root, 'src/client/library.tsx'),
    customer: join(root, 'src/client/customer.tsx'),
  },
  outdir: join(out, 'hub'),
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: true,
  sourcemap: false,
  jsx: 'transform',
  // Use the shared React on window, never a second copy (see src/client/react-global.ts).
  alias: { react: join(root, 'src/client/react-global.ts') },
  logLevel: 'warning',
});

mkdirSync(join(out, 'hub'), { recursive: true });
cpSync(join(root, 'src/hub.css'), join(out, 'hub/hub.css'));
writeFileSync(join(root, 'public/robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log('Built public/assets');

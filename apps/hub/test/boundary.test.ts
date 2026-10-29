/** The Hub must not be able to reach the Vault's database or files, by configuration or by import. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { build } from 'esbuild';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const stripJsonc = (s: string) => s.replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');
const config = JSON.parse(stripJsonc(readFileSync(join(root, 'wrangler.jsonc'), 'utf8')));

test('wrangler config has no database, file storage, queue, key-value, AI or other data binding', () => {
  const forbidden = ['d1_databases', 'r2_buckets', 'kv_namespaces', 'durable_objects', 'vectorize', 'ai', 'queues', 'hyperdrive', 'analytics_engine_datasets', 'browser', 'unsafe', 'tail_consumers', 'workflows', 'pipelines'];
  for (const k of forbidden) assert.equal(config[k], undefined, `the Hub config has "${k}"`);
});

test('the only bindings are the static assets and one service binding to the Vault entrypoint', () => {
  assert.equal(config.assets.binding, 'ASSETS');
  assert.deepEqual(config.services, [{ binding: 'VAULT', service: 'bc-vault', entrypoint: 'VaultPublic' }]);
  assert.equal(config.vars, undefined, 'no secrets or settings in the config file');
});

test('Hub source imports only the Hub routes from core, never the Vault app, stores or files', () => {
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') || p.endsWith('.tsx') ? [p] : []; });
  for (const file of walk(join(root, 'src'))) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'(@bc\/[^']+)'/g)) {
      const [, names, from] = m;
      if (from === '@bc/core') assert.deepEqual(names!.split(',').map((x) => x.trim()).filter(Boolean), ['createHubHandler'], `${file} imports from @bc/core: ${names}`);
      assert.ok(['@bc/core', '@bc/contract'].includes(from!), `${file} imports ${from}`);
    }
    assert.ok(!/cloudflare:workers|D1Database|R2Bucket|KVNamespace/.test(src), `${file} refers to a storage type`);
    assert.ok(!/@bc\/vault/.test(src), `${file} imports the Vault`);
  }
});

test('the Hub package does not depend on the Vault package', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies['@bc/vault'], undefined);
  assert.equal(pkg.devDependencies['@bc/vault'], undefined);
});

test('the Hub bundle contains no Assistant, Anthropic or Vault-logic code', async () => {
  const out = await build({ entryPoints: [join(root, 'src/index.ts')], bundle: true, write: false, format: 'esm', platform: 'neutral', external: ['cloudflare:workers'], logLevel: 'silent', mainFields: ['module', 'main'], conditions: ['workerd', 'worker', 'browser'] });
  const code = out.outputFiles.map((f) => f.text).join('\n');
  for (const forbidden of ['anthropic', 'search_records', 'project_overview', 'assistant.usage', 'ANTHROPIC_API_KEY', 'createApp', 'D1Store', 'MemoryStore', 'sha256Hex(d.id']) {
    assert.ok(!code.toLowerCase().includes(forbidden.toLowerCase()), `the Hub bundle contains "${forbidden}"`);
  }
  assert.ok(code.includes('createHubHandler') || code.includes('/hub/api/contact'), 'sanity: the Hub routes are in the bundle');
});

/**
 * Writes SQL files for seeding D1 with `wrangler d1 execute`:
 *   seed/base.sql   what a new deployment needs: the three templates, Block Concepts' own account, and their Registry numbers.
 *   seed/dev.sql    everything in the fixtures (fictional example data). For local development only.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fixtures } from '@bc/contract/fixtures';

const q = (s: string) => `'${s.replaceAll("'", "''")}'`;
type Row = { id: string; number?: string; archived: boolean; version: number; createdAt: string };

function inserts(data: Record<string, Row[]>): string {
  const out: string[] = [];
  for (const [type, rows] of Object.entries(data)) {
    for (const r of rows) {
      out.push(`INSERT INTO records (type, id, number, archived, version, created_at, data) VALUES (${q(type)}, ${q(r.id)}, ${r.number ? q(r.number) : 'NULL'}, ${r.archived ? 1 : 0}, ${r.version}, ${q(r.createdAt)}, ${q(JSON.stringify(r))});`);
    }
  }
  return out.join('\n') + '\n';
}

const dir = new URL('../seed/', import.meta.url);
mkdirSync(dir, { recursive: true });

const f = fixtures as unknown as Record<string, Row[]>;
const baseNumbers = new Set(f.template!.map((t) => t.number));
const base = {
  account: f.account!.filter((a) => a.id === 'acc-bc'),
  template: f.template!,
  registry: f.registry!.filter((r) => baseNumbers.has(r.number)),
};
writeFileSync(new URL('base.sql', dir), '-- Base data for a new deployment. Safe to run once on an empty database.\n' + inserts(base));
writeFileSync(new URL('dev.sql', dir), '-- Fictional example data. Local development only. Never run this against the production database.\n' + inserts(f));
console.log(`Wrote seed/base.sql (${Object.values(base).flat().length} rows) and seed/dev.sql (${Object.values(f).flat().length} rows)`);

import { conflict, HttpError } from '@bc/core';
import type { ListOptions, Op, Rec, Store } from '@bc/core';
import type { SqlDb, SqlStatement } from './sql.ts';

const FIELD = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** SQLite raises this on purpose when a guard statement finds a stale version (see apply). */
const STALE = 'integer overflow';

/** Records in D1 (or any SQLite). One table for every record type, the record itself as JSON. */
export class D1Store implements Store {
  private db: SqlDb;
  constructor(db: SqlDb) { this.db = db; }

  async get(type: string, id: string): Promise<Rec | undefined> {
    const rows = await this.db.all<{ data: string }>('SELECT data FROM records WHERE type = ? AND id = ?', [type, id]);
    return rows[0] ? JSON.parse(rows[0].data) : undefined;
  }

  async list(type: string, opts: ListOptions = {}): Promise<Rec[]> {
    const where = ['type = ?'];
    const params: unknown[] = [type];
    if (!opts.includeArchived) where.push('archived = 0');
    for (const [field, value] of Object.entries(opts.filters ?? {})) {
      // Field names come from the query string, so only plain names are allowed and they are never concatenated otherwise.
      if (!FIELD.test(field)) return [];
      where.push(`CAST(json_extract(data, '$.${field}') AS TEXT) = ?`);
      params.push(value === 'true' ? '1' : value === 'false' ? '0' : value);
    }
    if (opts.q) {
      where.push("lower(data) LIKE ? ESCAPE '\\'");
      params.push(`%${opts.q.toLowerCase().replace(/[\\%_]/g, (m) => `\\${m}`)}%`);
    }
    let sql = `SELECT data FROM records WHERE ${where.join(' AND ')} ORDER BY created_at, id`;
    if (opts.limit) { sql += ' LIMIT ?'; params.push(Math.max(1, Math.floor(opts.limit))); }
    const rows = await this.db.all<{ data: string }>(sql, params);
    return rows.map((r) => JSON.parse(r.data));
  }

  async maxSeq(registryType: string, yy: number): Promise<number> {
    const yyText = String(yy).padStart(2, '0');
    const rows = await this.db.all<{ m: number | null }>(
      "SELECT MAX(CAST(SUBSTR(number, 8) AS INTEGER)) AS m FROM records WHERE type = 'registry' AND number LIKE ?",
      [`BC-${registryType}-${yyText}%`],
    );
    return rows[0]?.m ?? 0;
  }

  async tokenLink(hash: string): Promise<string | undefined> {
    const rows = await this.db.all<{ link_id: string }>('SELECT link_id FROM share_tokens WHERE hash = ?', [hash]);
    return rows[0]?.link_id;
  }

  async apply(ops: Op[]): Promise<void> {
    const statements: SqlStatement[] = [];
    for (const op of ops) {
      if (op.kind === 'insert') {
        const r = op.rec;
        statements.push({
          sql: 'INSERT INTO records (type, id, number, archived, version, created_at, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
          params: [op.type, r.id, r.number ?? null, r.archived ? 1 : 0, r.version, r.createdAt, JSON.stringify(r)],
        });
      } else if (op.kind === 'update') {
        const r = op.rec;
        statements.push({
          sql: 'UPDATE records SET number = ?, archived = ?, version = ?, data = ? WHERE type = ? AND id = ? AND version = ?',
          params: [r.number ?? null, r.archived ? 1 : 0, r.version, JSON.stringify(r), op.type, r.id, op.expectedVersion],
        });
        // If the update touched no row (someone saved first), this raises and the whole batch rolls back.
        statements.push({ sql: `SELECT CASE WHEN changes() = 1 THEN 1 ELSE abs(-9223372036854775808) END`, params: [] });
      } else {
        statements.push({ sql: 'INSERT INTO share_tokens (hash, link_id) VALUES (?, ?)', params: [op.hash, op.linkId] });
      }
    }
    try {
      await this.db.batch(statements);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes(STALE)) throw conflict('This record changed since you loaded it. Reload and try again.');
      if (msg.includes('registry_number_unique') || msg.includes('records.number')) throw conflict('That Registry number is already in use.');
      if (msg.includes('UNIQUE') || msg.includes('PRIMARY')) throw conflict('That record already exists.');
      throw new HttpError(500, 'validation_failed', 'The database refused that change.');
    }
  }
}

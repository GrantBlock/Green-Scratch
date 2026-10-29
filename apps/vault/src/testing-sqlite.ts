/** node:sqlite adapter so the same SQL and store run in tests and local scripts. Not imported by the Worker. */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import type { SqlDb, SqlStatement } from './sql.ts';

export class NodeSqliteDb implements SqlDb {
  readonly db: DatabaseSync;
  constructor(path = ':memory:') { this.db = new DatabaseSync(path); }
  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...(params as never[])) as T[];
  }
  async batch(statements: SqlStatement[]): Promise<void> {
    this.db.exec('BEGIN');
    try {
      for (const s of statements) this.db.prepare(s.sql).all(...(s.params as never[]));
      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
  close(): void { this.db.close(); }
}

/** A fresh in-memory database with every migration applied, in order. */
export function migratedDb(): NodeSqliteDb {
  const db = new NodeSqliteDb();
  const dir = new URL('../migrations/', import.meta.url);
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) db.db.exec(readFileSync(new URL(f, dir), 'utf8'));
  return db;
}

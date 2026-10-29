/** The two things the store needs from a database. D1 implements it in production; node:sqlite implements it in tests. */
export interface SqlStatement { sql: string; params: unknown[] }

export interface SqlDb {
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Run the statements in order as one transaction: all of them apply, or none do. */
  batch(statements: SqlStatement[]): Promise<void>;
}

/** Cloudflare D1. */
export class D1Db implements SqlDb {
  private db: D1Database;
  constructor(db: D1Database) { this.db = db; }
  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const r = await this.db.prepare(sql).bind(...params).all<T>();
    return r.results;
  }
  async batch(statements: SqlStatement[]): Promise<void> {
    if (statements.length === 0) return;
    await this.db.batch(statements.map((s) => this.db.prepare(s.sql).bind(...s.params)));
  }
}

import { conflict, HttpError } from './errors.ts';
import type { Rec } from './util.ts';
import { formatNumber } from '@bc/contract';

export interface ListOptions {
  filters?: Record<string, string>;
  q?: string;
  includeArchived?: boolean;
  limit?: number;
}

/** A write queued inside a transaction. */
export type Op =
  | { kind: 'insert'; type: string; rec: Rec }
  | { kind: 'update'; type: string; rec: Rec; expectedVersion: number }
  | { kind: 'token'; hash: string; linkId: string };

/**
 * Where records live. The memory store (mock and tests) and the D1 store (production) both implement this, so the
 * business logic in app.ts is written once. Writes are queued in a Tx and applied together on commit.
 */
export interface Store {
  get(type: string, id: string): Promise<Rec | undefined>;
  list(type: string, opts?: ListOptions): Promise<Rec[]>;
  /** Highest sequence number already issued for a Registry type and two-digit year. */
  maxSeq(registryType: string, yy: number): Promise<number>;
  tokenLink(hash: string): Promise<string | undefined>;
  apply(ops: Op[]): Promise<void>;
}

export class Tx {
  readonly ops: Op[] = [];
  private issued = new Map<string, number>();
  private store: Store;
  private now: string;
  private yy: number;
  private idFn: (prefix: string) => string;
  constructor(store: Store, now: string, yy: number, idFn: (prefix: string) => string) {
    this.store = store; this.now = now; this.yy = yy; this.idFn = idFn;
  }

  insert(type: string, rec: Rec): void { this.ops.push({ kind: 'insert', type, rec }); }
  update(type: string, rec: Rec): void {
    const expectedVersion = rec.version;
    rec.version += 1;
    rec.updatedAt = this.now;
    this.ops.push({ kind: 'update', type, rec, expectedVersion });
  }
  putToken(hash: string, linkId: string): void { this.ops.push({ kind: 'token', hash, linkId }); }

  /** Issue a Registry number and record it. `explicit` is used for a project, which takes its quote's digits. */
  async issue(registryType: string, about?: { recordType: string; recordId: string }, explicit?: string): Promise<string> {
    let number = explicit;
    if (!number) {
      const next = Math.max(await this.store.maxSeq(registryType, this.yy), this.issued.get(registryType) ?? 0) + 1;
      this.issued.set(registryType, next);
      number = formatNumber(registryType, this.yy, next);
    }
    this.insert('registry', {
      id: this.idFn('reg'), version: 1, createdAt: this.now, updatedAt: this.now, archived: false, tags: [], type: 'registry',
      number, registryType, status: 'Issued', about,
    });
    return number;
  }

  async commit(): Promise<void> { await this.store.apply(this.ops); this.ops.length = 0; }
}

// ---- Memory store ----------------------------------------------------------------------------------------------------

export class MemoryStore implements Store {
  private tables = new Map<string, Map<string, Rec>>();
  private tokens = new Map<string, string>();

  constructor(initial?: Record<string, Rec[]>) {
    if (initial) for (const [type, rows] of Object.entries(initial)) for (const r of rows) this.table(type).set(r.id, structuredClone(r));
  }
  private table(type: string): Map<string, Rec> {
    let t = this.tables.get(type);
    if (!t) { t = new Map(); this.tables.set(type, t); }
    return t;
  }
  async get(type: string, id: string) { const r = this.table(type).get(id); return r ? structuredClone(r) : undefined; }
  async list(type: string, opts: ListOptions = {}) {
    let rows = [...this.table(type).values()];
    if (!opts.includeArchived) rows = rows.filter((r) => !r.archived);
    for (const [f, v] of Object.entries(opts.filters ?? {})) rows = rows.filter((r) => String(r[f]) === v);
    const q = opts.q?.toLowerCase();
    if (q) rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    rows.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || String(a.id).localeCompare(String(b.id)));
    return structuredClone(opts.limit ? rows.slice(0, opts.limit) : rows);
  }
  async maxSeq(registryType: string, yy: number) {
    let max = 0;
    for (const r of this.table('registry').values()) {
      const [, t, digits] = String(r.number).split('-');
      if (t === registryType && digits!.startsWith(String(yy).padStart(2, '0'))) max = Math.max(max, Number(digits!.slice(2)));
    }
    return max;
  }
  async tokenLink(hash: string) { return this.tokens.get(hash); }
  async apply(ops: Op[]) {
    // All or nothing: check first, then write.
    const numbers = new Set([...this.tables.values()].flatMap((t) => [...t.values()].map((r) => r.number).filter(Boolean)));
    for (const op of ops) {
      if (op.kind === 'insert') {
        if (this.table(op.type).has(op.rec.id)) throw conflict(`${op.type} "${op.rec.id}" already exists.`);
        if (op.type === 'registry') { if (numbers.has(op.rec.number)) throw conflict(`Number ${op.rec.number} is already in the registry.`); numbers.add(op.rec.number); }
      } else if (op.kind === 'update') {
        const cur = this.table(op.type).get(op.rec.id);
        if (!cur) throw new HttpError(404, 'not_found', `${op.type} "${op.rec.id}" was not found.`);
        if (cur.version !== op.expectedVersion) throw conflict('This record changed since you loaded it. Reload and try again.');
      }
    }
    for (const op of ops) {
      if (op.kind === 'token') this.tokens.set(op.hash, op.linkId);
      else this.table(op.type).set(op.rec.id, structuredClone(op.rec));
    }
  }
  /** For tests: everything as arrays by type. */
  dump(): Record<string, Rec[]> {
    return Object.fromEntries([...this.tables].map(([t, m]) => [t, structuredClone([...m.values()])]));
  }
}

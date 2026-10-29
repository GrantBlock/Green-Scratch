/** Tests every Store implementation must pass, so the memory store and the D1 store behave the same. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Store } from '../store.ts';
import { Tx } from '../store.ts';
import { newId } from '../util.ts';

export function runStoreConformance(label: string, make: () => Promise<{ store: Store; close?: () => Promise<void> | void }>): void {
  const t = (name: string, fn: (store: Store) => Promise<void>) => test(`[store ${label}] ${name}`, async () => {
    const { store, close } = await make();
    try { await fn(store); } finally { await close?.(); }
  });
  const NOW = '2026-10-29T15:00:00Z';
  const rec = (id: string, extra: Record<string, unknown> = {}) => ({ id, version: 1, createdAt: NOW, updatedAt: NOW, archived: false, tags: [], type: 'account', name: id, kind: 'Customer', clientCode: 'ABC', industries: [], ...extra });
  const tx = (store: Store) => new Tx(store, NOW, 26, newId);

  t('insert, get and list', async (s) => {
    const x = tx(s); x.insert('account', rec('a1', { name: 'Alpha' })); x.insert('account', rec('a2', { name: 'Beta', kind: 'Supplier' })); await x.commit();
    assert.equal((await s.get('account', 'a1'))?.name, 'Alpha');
    assert.equal(await s.get('account', 'nope'), undefined);
    assert.equal((await s.list('account')).length, 2);
    assert.deepEqual((await s.list('account', { filters: { kind: 'Supplier' } })).map((r) => r.id), ['a2']);
    assert.deepEqual((await s.list('account', { q: 'alph' })).map((r) => r.id), ['a1']);
    assert.equal((await s.list('account', { limit: 1 })).length, 1);
  });

  t('archived records are hidden unless asked for', async (s) => {
    const x = tx(s); x.insert('account', rec('a1')); x.insert('account', rec('a2', { archived: true })); await x.commit();
    assert.deepEqual((await s.list('account')).map((r) => r.id), ['a1']);
    assert.equal((await s.list('account', { includeArchived: true })).length, 2);
    assert.deepEqual((await s.list('account', { filters: { archived: 'true' }, includeArchived: true })).map((r) => r.id), ['a2']);
  });

  t('filters match booleans, numbers and strings as text', async (s) => {
    const x = tx(s); x.insert('contact', { ...rec('c1'), type: 'contact', accountId: 'a1', primary: true }); x.insert('contact', { ...rec('c2'), type: 'contact', accountId: 'a1', primary: false }); await x.commit();
    assert.deepEqual((await s.list('contact', { filters: { primary: 'true' } })).map((r) => r.id), ['c1']);
    assert.deepEqual((await s.list('contact', { filters: { primary: 'false' } })).map((r) => r.id), ['c2']);
    assert.equal((await s.list('contact', { filters: { version: '1' } })).length, 2);
  });

  t('a filter on a field name with odd characters is refused or matches nothing, never runs as SQL', async (s) => {
    const x = tx(s); x.insert('account', rec('a1')); await x.commit();
    const r = await s.list('account', { filters: { "name') OR 1=1 --": 'x' } }).catch(() => []);
    assert.equal(r.length, 0);
  });

  t('update needs the version the caller saw', async (s) => {
    const x = tx(s); x.insert('account', rec('a1')); await x.commit();
    const cur = (await s.get('account', 'a1'))!;
    const u = tx(s); u.update('account', { ...cur, name: 'Renamed' }); await u.commit();
    assert.equal((await s.get('account', 'a1'))!.version, 2);
    assert.equal((await s.get('account', 'a1'))!.name, 'Renamed');
    const stale = tx(s); stale.update('account', { ...cur, name: 'Stale' });
    await assert.rejects(stale.commit(), (e: any) => e.code === 'conflict');
    assert.equal((await s.get('account', 'a1'))!.name, 'Renamed');
  });

  t('a failed commit applies nothing', async (s) => {
    const x = tx(s); x.insert('account', rec('a1')); await x.commit();
    const bad = tx(s);
    bad.insert('account', rec('a2'));
    bad.insert('account', rec('a1'));
    await assert.rejects(bad.commit());
    assert.equal(await s.get('account', 'a2'), undefined, 'the first insert was rolled back');
  });

  t('registry numbers are issued in order, never twice, and the highest is found', async (s) => {
    assert.equal(await s.maxSeq('Q', 26), 0);
    const x = tx(s);
    assert.equal(await x.issue('Q'), 'BC-Q-26001');
    assert.equal(await x.issue('Q'), 'BC-Q-26002');
    assert.equal(await x.issue('D'), 'BC-D-26001');
    await x.commit();
    assert.equal(await s.maxSeq('Q', 26), 2);
    const y = tx(s);
    assert.equal(await y.issue('Q'), 'BC-Q-26003');
    await y.commit();
    const dup = tx(s);
    await assert.rejects(dup.issue('Q', undefined, 'BC-Q-26003').then(() => dup.commit()), (e: any) => e.code === 'conflict');
    assert.equal(await s.maxSeq('Q', 25), 0, 'a new year starts again');
  });

  t('share tokens map a hash to a link', async (s) => {
    const x = tx(s); x.putToken('abc', 'sl1'); await x.commit();
    assert.equal(await s.tokenLink('abc'), 'sl1');
    assert.equal(await s.tokenLink('zzz'), undefined);
  });

  t('nested data survives a round trip', async (s) => {
    const nested = { id: 'p1', version: 1, createdAt: NOW, updatedAt: NOW, archived: false, tags: ['x', 'y'], type: 'baseline', projectId: 'p', name: 'B', takenAt: NOW, items: [{ scheduleItemId: 'i', start: '2026-01-01', end: '2026-01-02', percentComplete: 5 }] };
    const x = tx(s); x.insert('baseline', nested); await x.commit();
    assert.deepEqual(await s.get('baseline', 'p1'), nested);
  });
}

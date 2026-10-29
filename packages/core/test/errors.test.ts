import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conflict, decodeError, encodeError, HttpError } from '../src/index.ts';

test('an expected error survives being reduced to its message, as happens across a service binding', () => {
  const e = encodeError(new HttpError(409, 'invalid_transition', 'That item is not waiting for a file.', { item: 'x' }));
  const crossed = new Error(`Error: ${e.message}`); // RPC may add its own prefix
  const back = decodeError(crossed)!;
  assert.equal(back.status, 409);
  assert.equal(back.code, 'invalid_transition');
  assert.equal(back.message, 'That item is not waiting for a file.');
  assert.deepEqual(back.fields, { item: 'x' });
  assert.equal(decodeError(conflict('x'))!.status, 409, 'a real HttpError passes straight through');
});

test('anything else is not mistaken for an expected error', () => {
  assert.equal(decodeError(new Error('database is on fire')), null);
  assert.equal(decodeError(new Error('@bc-http-error:{not json')), null);
  assert.equal(decodeError('a string'), null);
  assert.equal(encodeError(new Error('plain')).message, 'plain');
});

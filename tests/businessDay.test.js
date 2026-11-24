import test from 'node:test';
import assert from 'node:assert/strict';
import { getBusinessDay } from '../src/utils/businessDay.js';

test('WIB day changes at 17:00 UTC with exclusive upper boundary', () => {
  const before = getBusinessDay(new Date('2026-11-20T16:59:59.999Z'));
  const after = getBusinessDay(new Date('2026-11-20T17:00:00.000Z'));
  assert.equal(before.day, '2026-11-20');
  assert.equal(before.start, '2026-11-19T17:00:00.000Z');
  assert.equal(before.end, after.start);
  assert.equal(after.day, '2026-11-21');
});

test('WIB boundaries remain correct across year and leap day', () => {
  assert.deepEqual(getBusinessDay(new Date('2026-12-31T17:00:00Z')), {
    day: '2027-01-01', start: '2026-12-31T17:00:00.000Z', end: '2027-01-01T17:00:00.000Z',
  });
  assert.equal(getBusinessDay(new Date('2024-02-28T17:00:00Z')).day, '2024-02-29');
});

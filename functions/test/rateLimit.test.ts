import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeRateLimit } from '../src/index.js';

test('consumeRateLimit allows initial requests and blocks after threshold in same window', () => {
  const key = `test-${Date.now()}`;
  const start = Date.now();

  for (let i = 0; i < 10; i += 1) {
    assert.equal(consumeRateLimit(key, start), true);
  }

  assert.equal(consumeRateLimit(key, start), false);
});

test('consumeRateLimit resets after window', () => {
  const key = `test-reset-${Date.now()}`;
  const start = Date.now();

  for (let i = 0; i < 10; i += 1) {
    consumeRateLimit(key, start);
  }

  assert.equal(consumeRateLimit(key, start), false);
  assert.equal(consumeRateLimit(key, start + 61_000), true);
});

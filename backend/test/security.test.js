import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSessionToken,
  escapeHtml,
  hashOtp,
  hashSessionToken,
  normalizeEmail,
  normalizeInstagram,
  safeEqual
} from '../src/utils/security.js';

test('normalizes user identifiers', () => {
  assert.equal(normalizeEmail(' User@Example.COM '), 'user@example.com');
  assert.equal(normalizeInstagram(' @Creator.Name '), 'creator.name');
});

test('escapes untrusted HTML content', () => {
  assert.equal(
    escapeHtml('<script>"x" & y</script>'),
    '&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;'
  );
});

test('creates random refresh tokens and stores only deterministic hashes', () => {
  const token = createSessionToken();
  const secondToken = createSessionToken();
  const hash = hashSessionToken(token, 'test-secret');

  assert.notEqual(token, secondToken);
  assert.notEqual(hash, token);
  assert.equal(hash.length, 64);
  assert.equal(hash, hashSessionToken(token, 'test-secret'));
});

test('hashes OTPs deterministically without storing the raw code', () => {
  const hash = hashOtp('user@example.com', '123456', 'test-secret');
  assert.notEqual(hash, '123456');
  assert.equal(hash, hashOtp('USER@example.com', '123456', 'test-secret'));
  assert.equal(safeEqual(hash, hash), true);
  assert.equal(safeEqual(hash, hashOtp('user@example.com', '654321', 'test-secret')), false);
});

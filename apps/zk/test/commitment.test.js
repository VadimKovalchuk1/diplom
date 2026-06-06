const assert = require('node:assert');
const test = require('node:test');
const crypto = require('node:crypto');

test('demo commitment is deterministic', () => {
  const a = crypto.createHash('sha256').update('hash:secret').digest('hex');
  const b = crypto.createHash('sha256').update('hash:secret').digest('hex');
  assert.equal(a, b);
});

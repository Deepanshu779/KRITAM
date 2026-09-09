const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePoint, validateText, escapeSendKeys } = require('./computer-input');

test('accepts safe integer mouse coordinates', () => {
  assert.deepEqual(validatePoint(120, 240), { x: 120, y: 240 });
});

test('rejects invalid mouse coordinates', () => {
  assert.throws(() => validatePoint(-1, 20), /safe bounds/);
  assert.throws(() => validatePoint(10.5, 20), /integers/);
});

test('bounds text input and rejects null bytes', () => {
  assert.equal(validateText('hello'), 'hello');
  assert.throws(() => validateText(''), /Text is required/);
  assert.throws(() => validateText('a\0b'), /Invalid text/);
  assert.throws(() => validateText('x'.repeat(2001)), /too long/);
});

test('escapes SendKeys metacharacters literally', () => {
  assert.equal(escapeSendKeys('a+b^c%d~e(f)g{h}'), 'a{+}b{^}c{%}d{~}e{(}f{)}g{{}h{}}');
});

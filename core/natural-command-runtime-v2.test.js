const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSearchUrls } = require('./natural-command-runtime-v2');

test('builds multi-platform search URLs', () => {
  const urls = buildSearchUrls('red Banarasi saree under 3000');
  assert.ok(urls.length >= 3);
  assert.ok(urls.some((item) => item.platform === 'google'));
  assert.ok(urls.some((item) => item.platform === 'youtube'));
});

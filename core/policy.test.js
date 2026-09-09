const test = require('node:test');
const assert = require('node:assert/strict');
const { getPolicy, validateToolRequest, RISK_LEVELS } = require('./policy');

test('read-only tools require no approval', () => {
  assert.equal(getPolicy('system_info').risk, RISK_LEVELS.LOW);
  assert.equal(getPolicy('system_info').approval, 'none');
  assert.equal(getPolicy('get_time').approval, 'none');
});

test('desktop actions require session approval', () => {
  assert.equal(getPolicy('open_app').approval, 'session');
  assert.equal(getPolicy('open_url').approval, 'session');
});

test('unknown tools are rejected', () => {
  assert.throws(() => validateToolRequest({ tool: 'run_shell' }), /Tool is not allowed/);
});

test('arguments must be objects', () => {
  assert.throws(() => validateToolRequest({ tool: 'open_url', arguments: 'https://example.com' }), /Tool arguments must be an object/);
});

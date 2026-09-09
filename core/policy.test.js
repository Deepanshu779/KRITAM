const test = require('node:test');
const assert = require('node:assert/strict');
const { getPolicy, validateToolRequest, RISK_LEVELS } = require('./policy');

test('read-only and ordinary navigation tools require no approval', () => {
  assert.equal(getPolicy('system_info').risk, RISK_LEVELS.LOW);
  assert.equal(getPolicy('system_info').approval, 'none');
  assert.equal(getPolicy('get_time').approval, 'none');
  assert.equal(getPolicy('open_app').approval, 'none');
  assert.equal(getPolicy('open_url').approval, 'none');
  assert.equal(getPolicy('open_path').approval, 'none');
});

test('sensitive computer-control actions require explicit approval', () => {
  assert.equal(getPolicy('mouse_click').approval, 'always');
  assert.equal(getPolicy('type_text').approval, 'always');
  assert.equal(getPolicy('keyboard_shortcut').approval, 'always');
  assert.equal(getPolicy('screen_targets').approval, 'always');
});

test('unknown tools are rejected', () => {
  assert.throws(() => validateToolRequest({ tool: 'run_shell' }), /Tool is not allowed/);
});

test('arguments must be objects', () => {
  assert.throws(() => validateToolRequest({ tool: 'open_url', arguments: 'https://example.com' }), /Tool arguments must be an object/);
});

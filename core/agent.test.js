const test = require('node:test');
const assert = require('node:assert/strict');
const { planLocalCommand } = require('./agent');

test('plans approved website commands', () => {
  const request = planLocalCommand('open YouTube');
  assert.equal(request.tool, 'open_url');
  assert.equal(request.arguments.url, 'https://www.youtube.com');
});

test('plans Windows app commands', () => {
  const request = planLocalCommand('launch file explorer');
  assert.equal(request.tool, 'open_app');
  assert.equal(request.arguments.app, 'explorer');
});

test('plans read-only system commands', () => {
  assert.equal(planLocalCommand('show my PC specs').tool, 'system_info');
  assert.equal(planLocalCommand('what time is it').tool, 'get_time');
});

test('ignores unrelated natural language', () => {
  assert.equal(planLocalCommand('tell me a joke'), null);
});

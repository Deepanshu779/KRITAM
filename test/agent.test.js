const test = require('node:test');
const assert = require('node:assert/strict');
const { planLocalCommand } = require('../core/agent');
const { validateToolRequest } = require('../core/policy');

test('plans approved website commands', () => {
  const plan = planLocalCommand('Open GitHub');
  assert.equal(plan.tool, 'open_url');
  assert.equal(plan.arguments.url, 'https://github.com');
});

test('plans approved Windows app commands', () => {
  const plan = planLocalCommand('launch calculator');
  assert.equal(plan.tool, 'open_app');
  assert.equal(plan.arguments.app, 'calculator');
});

test('rejects unknown tools', () => {
  assert.throws(() => validateToolRequest({ tool: 'run_shell', arguments: { command: 'whoami' } }), /Tool is not allowed/);
});

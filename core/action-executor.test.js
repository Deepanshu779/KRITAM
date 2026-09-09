const test = require('node:test');
const assert = require('node:assert/strict');
const { createActionExecutor } = require('./action-executor');

test('executes a validated action and records tool confirmation', async () => {
  const executor = createActionExecutor({ execute: async () => ({ success: true, value: 'ok' }) });
  const result = await executor.run({ tool: 'system_info', arguments: {} });
  assert.equal(result.record.status, 'executed');
  assert.equal(result.record.verification, 'tool-confirmed');
  assert.equal(result.record.result.value, 'ok');
});

test('rejects tools outside the allowlist', async () => {
  const executor = createActionExecutor();
  await assert.rejects(() => executor.run({ tool: 'run_shell', arguments: { command: 'whoami' } }), /Tool is not allowed/);
});

test('returns a verification strategy with each action', async () => {
  const executor = createActionExecutor({ execute: async () => ({ success: true }) });
  const result = await executor.run({ tool: 'open_app', arguments: { app: 'notepad' } });
  assert.equal(result.verificationPlan.method, 'application_state');
});

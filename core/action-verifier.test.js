const test = require('node:test');
const assert = require('node:assert/strict');
const { createActionRecord, getVerificationPlan, verifyResult, applyScreenVerification } = require('./action-verifier');

test('creates an auditable action record', () => {
  const record = createActionRecord({ tool: 'mouse_click', arguments: { x: 10, y: 20 }, timestamp: '2026-09-09T00:00:00.000Z' });
  assert.equal(record.tool, 'mouse_click');
  assert.equal(record.verification, 'pending');
});

test('maps computer actions to semantic verification strategies', () => {
  assert.deepEqual(getVerificationPlan('mouse_click'), { supported: true, method: 'semantic_post_action_screen' });
  assert.deepEqual(getVerificationPlan('open_app'), { supported: true, method: 'application_state' });
  assert.equal(getVerificationPlan('unknown').supported, false);
});

test('confirms successful structured tool results', () => {
  const record = createActionRecord({ tool: 'open_app' });
  const verified = verifyResult(record, { success: true, app: 'Notepad' });
  assert.equal(verified.verification, 'tool-confirmed');
});

test('records screen verification without claiming certainty', () => {
  const record = createActionRecord({ tool: 'type_text' });
  const verified = applyScreenVerification(record, { changed: true, confidence: 1.4, note: 'UI changed after input.' });
  assert.equal(verified.verification, 'screen-confirmed');
  assert.equal(verified.verificationConfidence, 1);
});

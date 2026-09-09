const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeObservation, verifyScreenAction } = require('./verification');

test('normalizes screen verification observations', () => {
  assert.deepEqual(normalizeObservation({ changed: true, confidence: 0.9, note: 'Button disappeared' }), { changed: true, confidence: 0.9, note: 'Button disappeared' });
});

test('requires sufficient confidence for screen confirmation', () => {
  const record = { tool: 'mouse_click', status: 'executed', verification: 'pending' };
  assert.equal(verifyScreenAction(record, { changed: true, confidence: 0.9 }).verification, 'screen-confirmed');
  assert.equal(verifyScreenAction(record, { changed: true, confidence: 0.4 }).verification, 'screen-unchanged');
});

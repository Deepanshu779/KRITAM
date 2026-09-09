const test = require('node:test');
const assert = require('node:assert/strict');
const { rankTargets, selectTarget } = require('./target-selector');

test('ranks actionable targets by confidence and label match', () => {
  const result = rankTargets([
    { id: 'a', label: 'Save', confidence: 0.8, actionable: true },
    { id: 'b', label: 'Submit', confidence: 0.9, actionable: true },
    { id: 'c', label: 'Hidden', confidence: 1, actionable: false },
  ], 'submit');
  assert.equal(result[0].id, 'b');
  assert.equal(result.length, 2);
});

test('selects a confident unique target', () => {
  const result = selectTarget([
    { id: 'a', label: 'Submit', confidence: 0.94, actionable: true },
    { id: 'b', label: 'Cancel', confidence: 0.65, actionable: true },
  ], 'submit');
  assert.equal(result.status, 'selected');
  assert.equal(result.target.id, 'a');
});

test('asks for clarification when confidence is too low or candidates are too close', () => {
  assert.equal(selectTarget([{ id: 'a', label: 'Button', confidence: 0.5, actionable: true }], 'button').status, 'clarify');
  assert.equal(selectTarget([
    { id: 'a', label: 'Save', confidence: 0.82, actionable: true },
    { id: 'b', label: 'Save As', confidence: 0.8, actionable: true },
  ], 'save').status, 'clarify');
});

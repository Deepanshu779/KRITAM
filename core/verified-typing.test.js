const test = require('node:test');
const assert = require('node:assert/strict');
const { validateText, validateTypingTarget, chooseTypingTarget, buildTypingAction } = require('./verified-typing');

test('rejects empty and oversized text', () => {
  assert.throws(() => validateText('   '));
  assert.throws(() => validateText('x'.repeat(2001)));
});

test('accepts a high-confidence actionable field', () => {
  const target = validateTypingTarget({ label: 'Search box', x: 20, y: 30, confidence: 0.94 });
  assert.equal(target.label, 'Search box');
});

test('rejects low-confidence typing targets', () => {
  assert.throws(() => validateTypingTarget({ label: 'Search box', x: 20, y: 30, confidence: 0.7 }));
});

test('selects a clear text field and preserves ambiguity', () => {
  const selected = chooseTypingTarget([{ label: 'Search', x: 10, y: 10, confidence: 0.96 }], 'type into search');
  assert.equal(selected.status, 'selected');
  const ambiguous = chooseTypingTarget([
    { label: 'Search', x: 10, y: 10, confidence: 0.96 },
    { label: 'Search', x: 100, y: 100, confidence: 0.95 },
  ], 'type into search');
  assert.equal(ambiguous.status, 'ambiguous');
});

test('builds an approval-required typing action', () => {
  const action = buildTypingAction('type into search', 'KRITAM', { label: 'Search', x: 10, y: 10, confidence: 0.96 });
  assert.equal(action.requiresApproval, true);
  assert.equal(action.verification, 'semantic_post_action_screen');
  assert.equal(action.text, 'KRITAM');
});

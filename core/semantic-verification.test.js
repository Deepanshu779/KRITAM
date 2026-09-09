const test = require('node:test');
const assert = require('node:assert/strict');
const { parseVerificationResponse, normalizeVerification, buildVerificationPrompt } = require('./semantic-verification');

test('parses fenced JSON verification output', () => {
  const result = parseVerificationResponse('```json\n{"success":true,"confidence":0.91,"reason":"Dialog opened"}\n```');
  assert.equal(result.success, true);
  assert.equal(result.confidence, 0.91);
});

test('requires both semantic success and confidence threshold', () => {
  assert.equal(normalizeVerification({ success: true, confidence: 0.9 }).success, true);
  assert.equal(normalizeVerification({ success: true, confidence: 0.5 }).success, false);
  assert.equal(normalizeVerification({ success: false, confidence: 0.99 }).success, false);
});

test('builds a conservative verification prompt', () => {
  const prompt = buildVerificationPrompt('click Save', 'Save');
  assert.match(prompt, /ONLY valid JSON/);
  assert.match(prompt, /Do not infer success from the fact that the screen changed/);
});

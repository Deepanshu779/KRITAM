const test = require('node:test');
const assert = require('node:assert/strict');
const { clamp01, normalizeTarget, parseVisionTargets, buildTargetPrompt } = require('./screen-targets');

test('bounds confidence safely', () => {
  assert.equal(clamp01(2), 1);
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01('bad'), null);
});

test('normalizes a visible target', () => {
  const target = normalizeTarget({ label: 'Submit', x: 120.7, y: 240.2, confidence: 0.91 });
  assert.deepEqual(target, { id: 'target-1', label: 'Submit', x: 121, y: 240, confidence: 0.91, actionable: true });
});

test('parses only structured vision targets', () => {
  const targets = parseVisionTargets('{"targets":[{"id":"save","label":"Save","x":10,"y":20,"confidence":1}]}');
  assert.equal(targets.length, 1);
  assert.equal(targets[0].label, 'Save');
  assert.deepEqual(parseVisionTargets('not json'), []);
});

test('builds a no-guessing vision prompt', () => {
  const prompt = buildTargetPrompt('click the Save button');
  assert.match(prompt, /ONLY valid JSON/);
  assert.match(prompt, /Do not guess hidden elements/);
});

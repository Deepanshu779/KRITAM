const test = require('node:test');
const assert = require('node:assert/strict');
const { planNaturalCommand, INTENTS } = require('./natural-intent-v2');

test('understands brother cartoon request', () => {
  const plan = planNaturalCommand('Kritam mere bhai ko cartoon dekhna hai');
  assert.equal(plan.intent, INTENTS.PLAY);
  assert.equal(plan.subject, 'cartoon');
  assert.equal(plan.beneficiary, 'brother');
  assert.equal(plan.action.action, 'find_and_open_content');
});

test('understands mother saree shopping request', () => {
  const plan = planNaturalCommand('meri mummy ko ek Banarasi saree dekhni hai');
  assert.equal(plan.intent, INTENTS.SHOP);
  assert.equal(plan.subject, 'saree');
  assert.equal(plan.beneficiary, 'mother');
  assert.equal(plan.action.action, 'search_web');
});

test('does not confuse Hindi shopping display with play', () => {
  const plan = planNaturalCommand('mummy ke liye saree dikhao');
  assert.equal(plan.intent, INTENTS.SHOP);
  assert.equal(plan.subject, 'saree');
});

test('extracts useful shopping details', () => {
  const plan = planNaturalCommand('mummy ke liye red Banarasi saree under 3000 dikhao');
  assert.equal(plan.action.category, 'saree');
  assert.match(plan.action.query, /red/i);
  assert.match(plan.action.query, /3000/);
});

test('does not treat casual conversation as a command', () => {
  assert.equal(planNaturalCommand('I was thinking about cartoons yesterday'), null);
});

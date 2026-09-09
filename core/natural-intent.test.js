const test = require('node:test');
const assert = require('node:assert/strict');
const { INTENTS, planNaturalCommand } = require('./natural-intent');

test('understands brother cartoon request', () => {
  const result = planNaturalCommand('Kritam mere bhai ko ek cartoon dekhna hai');
  assert.equal(result.matched, true);
  assert.equal(result.intent, INTENTS.PLAY);
  assert.equal(result.subject, 'cartoon');
  assert.equal(result.beneficiary, 'brother');
  assert.equal(result.action.action, 'find_and_open_content');
});

test('understands mummy saree shopping request', () => {
  const result = planNaturalCommand('Kritam meri mummy ke liye saree chahiye');
  assert.equal(result.intent, INTENTS.SHOP);
  assert.equal(result.subject, 'saree');
  assert.equal(result.beneficiary, 'mother');
});

test('understands natural laptop search', () => {
  const result = planNaturalCommand('Kritam mere bhai ke liye laptop dhoondh do');
  assert.equal(result.intent, INTENTS.SEARCH);
  assert.equal(result.subject, 'laptop');
  assert.equal(result.beneficiary, 'brother');
});

test('understands natural music command', () => {
  const result = planNaturalCommand('Kritam ek gaana chala do');
  assert.equal(result.intent, INTENTS.PLAY);
  assert.equal(result.subject, 'song');
});

test('understands weather request', () => {
  const result = planNaturalCommand('Kritam aaj ka mausam batao');
  assert.equal(result.intent, INTENTS.WEATHER);
});

test('does not turn normal conversation into a desktop command', () => {
  assert.equal(planNaturalCommand('I was thinking about cartoons yesterday'), null);
});

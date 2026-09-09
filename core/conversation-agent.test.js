const test = require('node:test');
const assert = require('node:assert/strict');
const { detectIntent, mergeIntent, buildPlatformSearches, planConversationalMessage } = require('./conversation-agent');

test('detects natural mummy saree shopping request', () => {
  const result = detectIntent('meri mummy ko ek saree dekhni hai');
  assert.equal(result.intent, 'shopping');
  assert.equal(result.product, 'saree');
  assert.equal(result.beneficiary, 'mummy ji');
  assert.ok(result.missing.includes('style/type'));
});

test('merges follow-up details into the shopping state', () => {
  const first = detectIntent('meri mummy ko ek saree dekhni hai');
  const merged = mergeIntent(first, 'Banarasi red colour mein, 2000 ke andar');
  assert.equal(merged.slots.style, 'Banarasi');
  assert.equal(merged.slots.color, 'red');
  assert.equal(merged.slots.budget, 2000);
  assert.deepEqual(merged.missing, []);
});

test('builds multiple platform searches when details are complete', () => {
  const intent = mergeIntent(detectIntent('mummy ke liye saree chahiye'), 'Banarasi red 2000 ke andar');
  const platforms = buildPlatformSearches(intent);
  assert.equal(platforms.length, 4);
  assert.ok(platforms.every((item) => item.url.startsWith('https://')));
  assert.ok(platforms.some((item) => item.name === 'Amazon India'));
  assert.ok(platforms.some((item) => item.name === 'Flipkart'));
});

test('returns conversational response while details are missing', () => {
  const result = planConversationalMessage('I want to buy a laptop for my brother');
  assert.equal(result.intent, 'shopping');
  assert.equal(result.needsDetails, true);
  assert.match(result.response, /style|type|colour|color|budget/i);
});

test('ignores unrelated conversation', () => {
  assert.equal(planConversationalMessage('tell me a joke'), null);
});

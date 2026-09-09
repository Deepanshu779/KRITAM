const test = require('node:test');
const assert = require('node:assert/strict');
const { detectLanguage, buildPersonalityPrompt } = require('./personality');

test('detects Hindi and Hinglish', () => {
  assert.equal(detectLanguage('मुझे YouTube खोल दो'), 'hi');
  assert.equal(detectLanguage('bhai Chrome khol de'), 'hi');
});

test('detects Indian language scripts', () => {
  assert.equal(detectLanguage('ਸਤ ਸ੍ਰੀ ਅਕਾਲ'), 'pa');
  assert.equal(detectLanguage('வணக்கம்'), 'ta');
  assert.equal(detectLanguage('నమస్కారం'), 'te');
});

test('defaults Latin text to English', () => {
  assert.equal(detectLanguage('Please open my files'), 'en');
});

test('personality prompt requires natural multilingual behavior', () => {
  const prompt = buildPersonalityPrompt('bhai kya scene hai', [{ role: 'user', text: 'mera naam Deepanshu hai' }]);
  assert.match(prompt, /Hinglish/);
  assert.match(prompt, /smart, emotionally warm friend/);
  assert.match(prompt, /Recent conversation/);
});

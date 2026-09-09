const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getVoiceLocale,
  scoreVoice,
  selectFriendlyVoice,
  getSpeechStyle,
} = require('./voice');

test('maps Indian languages to speech locales', () => {
  assert.equal(getVoiceLocale('en'), 'en-IN');
  assert.equal(getVoiceLocale('hinglish'), 'en-IN');
  assert.equal(getVoiceLocale('hi'), 'hi-IN');
  assert.equal(getVoiceLocale('ta'), 'ta-IN');
  assert.equal(getVoiceLocale('unknown'), 'en-IN');
});

test('prefers language-matched natural female voices', () => {
  const voices = [
    { name: 'Microsoft David Desktop', lang: 'en-US', default: true },
    { name: 'Microsoft Neerja Online Natural Voice', lang: 'en-IN', default: false },
    { name: 'Microsoft Heera', lang: 'hi-IN', default: false },
  ];
  assert.equal(selectFriendlyVoice(voices, 'hi').name, 'Microsoft Heera');
  assert.equal(scoreVoice(voices[1], 'en') > scoreVoice(voices[0], 'en'), true);
});

test('uses a slightly gentler speaking style for regional languages', () => {
  const hindi = getSpeechStyle('hi');
  const english = getSpeechStyle('en');
  assert.equal(hindi.locale, 'hi-IN');
  assert.equal(hindi.rate < english.rate, true);
  assert.equal(hindi.pitch, 1.06);
});

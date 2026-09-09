const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeTranscript,
  isInterruptPhrase,
  isWakePhrase,
  shouldCancelSpeech,
  createVoiceSessionState,
} = require('./voice-session');

test('normalizes spoken transcripts', () => {
  assert.equal(normalizeTranscript('  hey   KRITAM  '), 'hey KRITAM');
});

test('recognizes friendly interruption phrases', () => {
  assert.equal(isInterruptPhrase('stop'), true);
  assert.equal(isInterruptPhrase('wait please'), true);
  assert.equal(isInterruptPhrase('रुको'), true);
  assert.equal(isInterruptPhrase('open chrome'), false);
});

test('recognizes KRITAM wake phrase', () => {
  assert.equal(isWakePhrase('Hey KRITAM'), true);
  assert.equal(isWakePhrase('hey kritam open chrome'), true);
  assert.equal(isWakePhrase('hello kritam'), false);
});

test('wake and interrupt phrases cancel speech', () => {
  assert.equal(shouldCancelSpeech('stop'), true);
  assert.equal(shouldCancelSpeech('Hey KRITAM'), true);
  assert.equal(shouldCancelSpeech('tell me the time'), false);
});

test('creates predictable voice session state', () => {
  assert.deepEqual(createVoiceSessionState(), {
    active: false,
    speaking: false,
    interrupted: false,
    wakeWord: true,
  });
});

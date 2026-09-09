const INTERRUPT_PHRASES = Object.freeze([
  'stop', 'wait', 'hold on', 'shut up', 'be quiet',
  'bas', 'ruko', 'ruk ja', 'रुको', 'बस', 'चुप', 'ठहरो'
]);

function normalizeTranscript(text) {
  return String(text || '').trim().replace(/\s+/g, ' ');
}

function isInterruptPhrase(text) {
  const value = normalizeTranscript(text).toLowerCase();
  if (!value) return false;
  return INTERRUPT_PHRASES.some((phrase) => value === phrase || value.startsWith(`${phrase} `));
}

function isWakePhrase(text) {
  return /\bhey\s+kri(?:tam|tan|tum)\b/i.test(normalizeTranscript(text));
}

function shouldCancelSpeech(text) {
  return isInterruptPhrase(text) || isWakePhrase(text);
}

function createVoiceSessionState() {
  return {
    active: false,
    speaking: false,
    interrupted: false,
    wakeWord: true,
  };
}

module.exports = {
  INTERRUPT_PHRASES,
  normalizeTranscript,
  isInterruptPhrase,
  isWakePhrase,
  shouldCancelSpeech,
  createVoiceSessionState,
};

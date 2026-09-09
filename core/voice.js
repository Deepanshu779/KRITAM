const VOICE_LOCALES = Object.freeze({
  en: 'en-IN',
  hi: 'hi-IN',
  hinglish: 'en-IN',
  pa: 'pa-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  ur: 'ur-IN',
});

const FEMALE_HINTS = Object.freeze([
  'jenny', 'aria', 'sara', 'zira', 'hazel', 'samantha', 'heera',
  'neerja', 'swara', 'aditi', 'raveena', 'female', 'woman', 'girl'
]);

const NATURAL_HINTS = Object.freeze([
  'online', 'natural', 'neural', 'premium', 'enhanced', 'multilingual'
]);

function normalizeLanguage(code) {
  return VOICE_LOCALES[code] ? code : 'en';
}

function getVoiceLocale(code) {
  return VOICE_LOCALES[normalizeLanguage(code)];
}

function scoreVoice(voice, language = 'en') {
  if (!voice) return -Infinity;
  const locale = getVoiceLocale(language);
  const lang = String(voice.lang || '').toLowerCase();
  const name = String(voice.name || '').toLowerCase();
  const wanted = locale.toLowerCase();
  const prefix = wanted.split('-')[0];

  let score = 0;
  if (lang === wanted) score += 100;
  else if (lang.startsWith(`${prefix}-`)) score += 60;
  else if (lang.startsWith(prefix)) score += 40;

  if (FEMALE_HINTS.some((hint) => name.includes(hint))) score += 30;
  if (NATURAL_HINTS.some((hint) => name.includes(hint))) score += 20;
  if (voice.default) score += 3;

  return score;
}

function selectFriendlyVoice(voices, language = 'en') {
  if (!Array.isArray(voices) || !voices.length) return null;
  return voices
    .map((voice, index) => ({ voice, index, score: scoreVoice(voice, language) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)[0].voice;
}

function getSpeechStyle(language = 'en') {
  const regional = ['hi', 'pa', 'bn', 'mr', 'gu', 'ta', 'te', 'kn', 'ml', 'ur'].includes(language);
  return {
    rate: regional ? 0.93 : 0.95,
    pitch: 1.06,
    volume: 0.96,
    pauseMs: 120,
    locale: getVoiceLocale(language),
  };
}

module.exports = {
  VOICE_LOCALES,
  FEMALE_HINTS,
  NATURAL_HINTS,
  normalizeLanguage,
  getVoiceLocale,
  scoreVoice,
  selectFriendlyVoice,
  getSpeechStyle,
};

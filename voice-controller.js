(() => {
  'use strict';

  const FEMALE_HINTS = ['jenny', 'aria', 'zira', 'hazel', 'samantha', 'heera', 'neerja', 'swara', 'aditi', 'raveena', 'female'];
  const NATURAL_HINTS = ['online', 'natural', 'neural', 'premium'];
  const INTERRUPT_WORDS = ['stop', 'wait', 'hold on', 'bas', 'ruko', 'ruk ja', 'रुको', 'बस', 'चुप', 'ठहरो'];
  let voices = [];
  let speaking = false;

  function refreshVoices() {
    if ('speechSynthesis' in window) voices = speechSynthesis.getVoices();
  }

  function languagePrefix(lang) {
    return String(lang || 'en-IN').toLowerCase().split('-')[0];
  }

  function pickNaturalFemale(utterance) {
    refreshVoices();
    if (!voices.length) return null;
    const prefix = languagePrefix(utterance.lang);
    const regional = voices.filter((voice) => voice.lang && languagePrefix(voice.lang) === prefix);
    const pool = regional.length ? regional : voices;
    const female = pool.filter((voice) => FEMALE_HINTS.some((hint) => voice.name.toLowerCase().includes(hint)));
    const natural = female.filter((voice) => NATURAL_HINTS.some((hint) => voice.name.toLowerCase().includes(hint)));
    return natural[0] || female[0] || pool.find((voice) => voice.default) || pool[0] || null;
  }

  function normalize(text) {
    return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function isInterrupt(text) {
    const value = normalize(text);
    return INTERRUPT_WORDS.some((phrase) => value === phrase || value.startsWith(`${phrase} `));
  }

  function stopSpeaking(reason = 'interrupt') {
    if (!('speechSynthesis' in window)) return false;
    const wasSpeaking = speaking || speechSynthesis.speaking;
    speechSynthesis.cancel();
    speaking = false;
    if (wasSpeaking && reason === 'interrupt') {
      const status = document.querySelector('#statusText');
      if (status) status.textContent = 'KRITAM is listening';
    }
    return wasSpeaking;
  }

  function installSpeechTuning() {
    if (!('speechSynthesis' in window) || speechSynthesis.__kritamVoiceController) return;
    const originalSpeak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (utterance) => {
      const voice = pickNaturalFemale(utterance);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      utterance.rate = Math.min(1.0, Math.max(0.88, Number(utterance.rate) || 0.94));
      utterance.pitch = Math.min(1.18, Math.max(0.98, Number(utterance.pitch) || 1.07));
      utterance.onstart = ((previous) => (event) => {
        speaking = true;
        previous?.(event);
      })(utterance.onstart);
      utterance.onend = ((previous) => (event) => {
        speaking = false;
        previous?.(event);
      })(utterance.onend);
      utterance.onerror = ((previous) => (event) => {
        speaking = false;
        previous?.(event);
      })(utterance.onerror);
      originalSpeak(utterance);
    };
    speechSynthesis.__kritamVoiceController = true;
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && (speaking || speechSynthesis?.speaking)) {
      event.preventDefault();
      stopSpeaking('interrupt');
    }
  }, true);

  document.addEventListener('click', (event) => {
    const mic = event.target.closest?.('#micButton');
    if (!mic) return;
    if (speaking || speechSynthesis?.speaking) {
      event.preventDefault();
      event.stopImmediatePropagation();
      stopSpeaking('interrupt');
    }
  }, true);

  document.addEventListener('voice:interrupt', (event) => {
    if (isInterrupt(event.detail?.text)) stopSpeaking('interrupt');
  });

  refreshVoices();
  if ('speechSynthesis' in window) speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
  installSpeechTuning();
  window.kritamVoiceController = Object.freeze({ stopSpeaking, isInterrupt, refreshVoices });
})();

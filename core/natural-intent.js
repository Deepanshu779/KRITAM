const INTENTS = Object.freeze({
  WATCH: 'watch', SEARCH: 'search', SHOP: 'shopping', OPEN: 'open', PLAY: 'play', MUSIC: 'music', NAVIGATE: 'navigate', STUDY: 'study', MESSAGE: 'message', CALL: 'call', WEATHER: 'weather', NEWS: 'news', FILE: 'file', REMINDER: 'reminder' });

const SUBJECTS = Object.freeze({
  cartoon: ['cartoon', 'cartoons', 'animation', 'animated video', 'animated show'],
  movie: ['movie', 'film', 'picture'],
  song: ['song', 'music', 'gaana', 'गाना'],
  video: ['video', 'videos'],
  laptop: ['laptop', 'notebook'], phone: ['phone', 'mobile', 'smartphone'],
  saree: ['saree', 'sari', 'साड़ी'], shoes: ['shoes', 'shoe'], gift: ['gift', 'present'],
  restaurant: ['restaurant', 'food', 'khana'], train: ['train', 'रेल'], flight: ['flight', 'फ्लाइट'],
  course: ['course', 'courses', 'class', 'tutorial'], file: ['file', 'document', 'folder'],
});

const PEOPLE = Object.freeze({
  brother: ['bhai', 'bhaiya', 'brother'], sister: ['behen', 'didi', 'sister'],
  mother: ['mummy', 'mom', 'mother', 'maa'], father: ['papa', 'dad', 'father'],
  friend: ['friend', 'dost'], self: ['me', 'myself', 'mujhe', 'mere liye'],
});

function normalize(text) { return String(text || '').trim().replace(/\s+/g, ' '); }
function findMatch(text, dictionary) {
  const q = text.toLowerCase();
  for (const [key, words] of Object.entries(dictionary)) {
    if (words.some((word) => q.includes(word.toLowerCase()))) return key;
  }
  return null;
}
function detectIntentType(q) {
  if (/\b(call|phone|ring|baat)\b/i.test(q)) return INTENTS.CALL;
  if (/\b(message|text|msg|whatsapp|send)\b/i.test(q)) return INTENTS.MESSAGE;
  if (/\b(weather|mausam|मौसम)\b/i.test(q)) return INTENTS.WEATHER;
  if (/\b(news|khabar|खबर)\b/i.test(q)) return INTENTS.NEWS;
  if (/\b(remind|reminder|yaad|याद)\b/i.test(q)) return INTENTS.REMINDER;
  if (/\b(study|learn|padh|पढ़|revision|revise)\b/i.test(q)) return INTENTS.STUDY;
  if (/\b(play|chala|chalao|चलाओ|देखना|dekhna|dikha|dikhao|दिखाओ)\b/i.test(q)) return INTENTS.PLAY;
  if (/\b(buy|purchase|shopping|shop|lena|lena hai|kharid|kharidna|chahiye|चाहिए|खरीद)\b/i.test(q)) return INTENTS.SHOP;
  if (/\b(search|find|look for|dhundh|dhoondh|ढूंढ|search karo)\b/i.test(q)) return INTENTS.SEARCH;
  if (/\b(open|launch|start|khol|kholo|खोलो)\b/i.test(q)) return INTENTS.OPEN;
  if (/\b(go to|visit|navigate|jao|जाओ)\b/i.test(q)) return INTENTS.NAVIGATE;
  return null;
}
function extractSubject(q) { return findMatch(q, SUBJECTS); }
function extractPerson(q) { return findMatch(q, PEOPLE); }
function extractQuery(q, subject) {
  if (!subject) return q;
  return q.replace(new RegExp(`\\b${subject}\\b`, 'i'), '').replace(/\s+/g, ' ').trim();
}
function isNaturalCommand(q) {
  return /\b(kritam|please|can you|could you|i want|i need|mere|meri|mere bhai|meri mummy|mujhe|mujhko|for my|dekhna hai|chahiye|kar do|karo|dikhana|dikhao)\b/i.test(q);
}
function buildAction(intent, subject, person, q) {
  if (intent === INTENTS.PLAY && subject === 'cartoon') {
    return { action: 'find_and_open_content', contentType: 'cartoon', beneficiary: person, query: 'cartoon' };
  }
  if (intent === INTENTS.PLAY && subject) return { action: 'find_and_open_content', contentType: subject, beneficiary: person, query: subject };
  if ((intent === INTENTS.SEARCH || intent === INTENTS.SHOP) && subject) return { action: 'search_web', category: subject, beneficiary: person, query: extractQuery(q, subject) || subject };
  if (intent === INTENTS.OPEN || intent === INTENTS.NAVIGATE) return { action: 'open_target', target: extractQuery(q, subject) || subject };
  return { action: 'conversational_assist', query: q };
}
function planNaturalCommand(text) {
  const q = normalize(text);
  if (!q) return null;
  const intent = detectIntentType(q);
  const subject = extractSubject(q);
  const person = extractPerson(q);
  if (!intent || (!subject && !isNaturalCommand(q))) return null;
  return { matched: true, intent, subject, beneficiary: person, action: buildAction(intent, subject, person, q), original: q };
}

module.exports = { INTENTS, SUBJECTS, PEOPLE, normalize, detectIntentType, extractSubject, extractPerson, isNaturalCommand, planNaturalCommand };

const INTENTS = Object.freeze({
  PLAY: 'play', SHOP: 'shopping', SEARCH: 'search', OPEN: 'open', NAVIGATE: 'navigate', STUDY: 'study', WEATHER: 'weather', NEWS: 'news', REMINDER: 'reminder', MESSAGE: 'message', CALL: 'call'
});

const SUBJECTS = Object.freeze({
  cartoon: ['cartoon', 'cartoons', 'animation', 'animated video', 'animated show'],
  movie: ['movie', 'film', 'picture'],
  song: ['song', 'music', 'gaana', 'गाना'],
  video: ['video', 'videos'],
  laptop: ['laptop', 'notebook'],
  phone: ['phone', 'mobile', 'smartphone'],
  saree: ['saree', 'sari', 'साड़ी'],
  shoes: ['shoes', 'shoe'],
  gift: ['gift', 'present'],
  restaurant: ['restaurant', 'food', 'khana'],
  train: ['train', 'रेल'],
  flight: ['flight', 'फ्लाइट'],
  course: ['course', 'courses', 'class', 'tutorial'],
  file: ['file', 'document', 'folder']
});

const PEOPLE = Object.freeze({
  brother: ['bhai', 'bhaiya', 'brother'],
  sister: ['behen', 'didi', 'sister'],
  mother: ['mummy', 'mom', 'mother', 'maa'],
  father: ['papa', 'dad', 'father'],
  friend: ['friend', 'dost'],
  self: ['me', 'myself', 'mujhe', 'mere liye']
});

function normalize(text) { return String(text || '').trim().replace(/\s+/g, ' '); }
function matchDictionary(q, dictionary) {
  const lower = q.toLowerCase();
  for (const [key, words] of Object.entries(dictionary)) {
    if (words.some((word) => lower.includes(word.toLowerCase()))) return key;
  }
  return null;
}
function findSubject(q) { return matchDictionary(q, SUBJECTS); }
function findPerson(q) { return matchDictionary(q, PEOPLE); }
function detectIntent(q, subject) {
  const s = q.toLowerCase();
  if (/\b(call|phone|ring|baat)\b/.test(s) && !subject) return INTENTS.CALL;
  if (/\b(message|text|msg|whatsapp|send)\b/.test(s)) return INTENTS.MESSAGE;
  if (/\b(weather|mausam|मौसम)\b/.test(s)) return INTENTS.WEATHER;
  if (/\b(news|khabar|खबर)\b/.test(s)) return INTENTS.NEWS;
  if (/\b(remind|reminder|yaad|याद)\b/.test(s)) return INTENTS.REMINDER;
  if (/\b(study|learn|padh|पढ़|revision|revise)\b/.test(s)) return INTENTS.STUDY;
  // Shopping takes priority over Hindi 'dikhao/dekhna' because product requests commonly use those words.
  if (/\b(buy|purchase|shopping|shop|lena|kharid|kharidna|chahiye|चाहिए|खरीद)\b/.test(s) || (subject && /\b(dikhao|dikhana|dekhna|dikhai|दिखाओ|देखना|दिखाना)\b/i.test(q) && /\b(ke liye|for|mummy|maa|mom|mother|papa|dad|bhai|brother|behen|sister)\b/i.test(q))) return INTENTS.SHOP;
  if (/\b(search|find|look for|dhundh|dhoondh|ढूंढ|search karo)\b/.test(s)) return INTENTS.SEARCH;
  if (/\b(play|chala|chalao|चलाओ)\b/.test(s) || (subject && /\b(dekhna|dekho|देखना|देखो)\b/i.test(q) && subject !== 'saree')) return INTENTS.PLAY;
  if (/\b(open|launch|start|khol|kholo|खोलो)\b/.test(s)) return INTENTS.OPEN;
  if (/\b(go to|visit|navigate|jao|जाओ)\b/.test(s)) return INTENTS.NAVIGATE;
  return null;
}
function isCommandLike(q) {
  return /\b(kritam|please|can you|could you|i want|i need|mere|meri|mujhe|mujhko|for my|ke liye|chahiye|kar do|karo|dikhana|dikhao|dekhna hai)\b/i.test(q);
}
function buildQuery(q, subject) {
  if (!subject) return q;
  const words = SUBJECTS[subject] || [];
  let result = q;
  for (const word of words) result = result.replace(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), '');
  return result.replace(/\b(kritam|mere|meri|mummy|mom|mother|maa|papa|dad|bhai|bhaiya|brother|behen|didi|sister|ke liye|for|dikhao|dikhana|dekhna hai|chahiye|please)\b/ig, ' ').replace(/\s+/g, ' ').trim() || subject;
}
function buildAction(intent, subject, person, q) {
  if (intent === INTENTS.PLAY) return { action: 'find_and_open_content', contentType: subject || 'video', beneficiary: person, query: subject || buildQuery(q, subject) };
  if (intent === INTENTS.SHOP || intent === INTENTS.SEARCH) return { action: 'search_web', category: subject || 'general', beneficiary: person, query: buildQuery(q, subject) };
  if (intent === INTENTS.OPEN || intent === INTENTS.NAVIGATE) return { action: 'open_target', target: buildQuery(q, subject) || subject };
  return { action: 'conversational_assist', query: q };
}
function planNaturalCommand(text) {
  const q = normalize(text);
  if (!q) return null;
  const subject = findSubject(q);
  const person = findPerson(q);
  const intent = detectIntent(q, subject);
  if (!intent || (!subject && !isCommandLike(q))) return null;
  return { matched: true, intent, subject, beneficiary: person, action: buildAction(intent, subject, person, q), original: q };
}

module.exports = { INTENTS, SUBJECTS, PEOPLE, normalize, findSubject, findPerson, detectIntent, planNaturalCommand };

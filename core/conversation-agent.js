const SESSION_TTL_MS = 30 * 60 * 1000;

const PLATFORM_SEARCHERS = Object.freeze([
  { name: 'Amazon India', build: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}` },
  { name: 'Flipkart', build: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}` },
  { name: 'Meesho', build: (q) => `https://www.meesho.com/search?q=${encodeURIComponent(q)}` },
  { name: 'Google Shopping', build: (q) => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}` },
]);

const PRODUCT_WORDS = Object.freeze([
  'saree', 'sari', 'laptop', 'phone', 'mobile', 'shoes', 'shoe', 'watch', 'bag', 'dress',
  'shirt', 'jeans', 'gift', 'headphones', 'earbuds', 'tv', 'tablet', 'camera', 'perfume',
  'kurta', 'lehenga', 'jacket', 'appliance', 'fridge', 'refrigerator', 'washing machine',
]);

function normalize(text) { return String(text || '').trim().replace(/\s+/g, ' '); }
function hasShoppingSignal(q) {
  return /\b(buy|purchase|shopping|shop|find|search|show|need|want|lena|len(i|a)|chahiye|dekhna|dikha|dikhana|kharid|kharidna|खरीद|चाहिए|देखना|दिखाओ)\b/i.test(q);
}
function extractProduct(q) {
  const lower = q.toLowerCase();
  return PRODUCT_WORDS.find((word) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'i').test(lower)) || null;
}
function extractBeneficiary(q) {
  const match = q.match(/\b(?:my|meri|mere|mummy|mom|mother|papa|dad|father|brother|sister|wife|husband|friend|daughter|son)\b[^.?!,;]{0,35}/i);
  if (!match) return null;
  const words = match[0].toLowerCase();
  if (/mummy|mom|mother/.test(words)) return 'mummy ji';
  if (/papa|dad|father/.test(words)) return 'papa ji';
  if (/brother/.test(words)) return 'brother';
  if (/sister/.test(words)) return 'sister';
  if (/wife/.test(words)) return 'wife';
  if (/husband/.test(words)) return 'husband';
  if (/friend/.test(words)) return 'friend';
  if (/daughter/.test(words)) return 'daughter';
  if (/son/.test(words)) return 'son';
  return null;
}
function extractColor(q) {
  const match = q.match(/\b(red|blue|black|white|green|pink|yellow|purple|maroon|gold|golden|silver|beige|cream|navy|brown|grey|gray|लाल|नीला|काला|सफेद|हरा|गुलाबी|पीला)\b/i);
  return match ? match[1] : null;
}
function extractBudget(q) {
  const match = q.match(/(?:under|below|within|max(?:imum)?|upto|up to|budget|ke andar|tak|में|के अंदर)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)\s*(?:₹|rs\.?|inr)?/i) || q.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i);
  return match ? Number(match[1].replace(/,/g, '')) : null;
}
function extractStyle(q) {
  const match = q.match(/\b(banarasi|silk|cotton|georgette|chiffon|linen|kanjeevaram|kanjivaram|party wear|casual|formal|running|gaming|office|wireless|leather|ethnic|western|traditional)\b/i);
  return match ? match[1] : null;
}
function detectIntent(text) {
  const q = normalize(text);
  if (!q) return null;
  const product = extractProduct(q);
  if (!product || !hasShoppingSignal(q)) return null;
  const beneficiary = extractBeneficiary(q);
  const color = extractColor(q);
  const budget = extractBudget(q);
  const style = extractStyle(q);
  const missing = [];
  if (!style) missing.push('style/type');
  if (!color) missing.push('color');
  if (!budget) missing.push('budget');
  return { intent: 'shopping', product, beneficiary, slots: { style, color, budget }, missing, original: q };
}
function mergeIntent(intent, followUp) {
  if (!intent) return detectIntent(followUp);
  const q = normalize(followUp);
  const slots = { ...intent.slots };
  slots.color ||= extractColor(q);
  slots.budget ||= extractBudget(q);
  slots.style ||= extractStyle(q);
  return { ...intent, slots, missing: ['style/type', 'color', 'budget'].filter((key) => !slots[{ 'style/type': 'style', color: 'color', budget: 'budget' }[key]]) };
}
function buildSearchQuery(intent) {
  const parts = [intent.slots.style, intent.slots.color, intent.product].filter(Boolean);
  let query = parts.join(' ');
  if (intent.slots.budget) query += ` under ₹${intent.slots.budget}`;
  return query.trim();
}
function buildPlatformSearches(intent) {
  const query = buildSearchQuery(intent);
  return PLATFORM_SEARCHERS.map((platform) => ({ name: platform.name, url: platform.build(query), query }));
}
function friendlyPrompt(intent) {
  const person = intent.beneficiary ? `${intent.beneficiary}` : 'aapke liye';
  if (intent.missing.includes('style/type')) return `Bilkul ji. ${person} ke liye ${intent.product} dhoondh dete hain. Kis type ya style ki pasand hai?`;
  if (intent.missing.includes('color')) return `Perfect ji. Colour kaunsa rakhna hai?`;
  if (intent.missing.includes('budget')) return `Nice ji. Budget roughly kitna rakhna hai?`;
  return `Bilkul ji, main options compare karne ke liye ready hoon.`;
}
function createConversationState(intent) {
  return { intent, updatedAt: Date.now() };
}
function isFresh(state) { return Boolean(state && Date.now() - state.updatedAt < SESSION_TTL_MS); }
function planConversationalMessage(text, state = null) {
  const fresh = isFresh(state) ? state.intent : null;
  const detected = fresh ? mergeIntent(fresh, text) : detectIntent(text);
  if (!detected) return null;
  const complete = detected.missing.length === 0;
  return {
    matched: true,
    intent: detected.intent,
    state: createConversationState(detected),
    response: friendlyPrompt(detected),
    needsDetails: !complete,
    searchQuery: complete ? buildSearchQuery(detected) : null,
    platforms: complete ? buildPlatformSearches(detected) : [],
  };
}
module.exports = { SESSION_TTL_MS, PLATFORM_SEARCHERS, detectIntent, mergeIntent, buildSearchQuery, buildPlatformSearches, createConversationState, isFresh, planConversationalMessage };

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createDefaultState() {
  return { version: 1, preferences: {}, conversations: { default: [] } };
}

function createMemoryStore(filePath, options = {}) {
  if (typeof filePath !== 'string' || !filePath.trim()) throw new Error('Memory file path is required.');
  const maxMessages = Number.isInteger(options.maxMessages) ? Math.max(1, options.maxMessages) : 500;
  let state = createDefaultState();

  function normalize(value) {
    if (!value || typeof value !== 'object') return createDefaultState();
    const conversations = value.conversations && typeof value.conversations === 'object'
      ? value.conversations
      : { default: [] };
    const normalized = {
      version: 1,
      preferences: value.preferences && typeof value.preferences === 'object' ? value.preferences : {},
      conversations: {},
    };
    for (const [id, messages] of Object.entries(conversations)) {
      if (!Array.isArray(messages)) {
        normalized.conversations[id] = [];
        continue;
      }
      normalized.conversations[id] = messages.slice(-maxMessages).filter((message) => (
        message && typeof message === 'object' &&
        ['user', 'assistant', 'system'].includes(message.role) &&
        typeof message.text === 'string'
      ));
    }
    if (!normalized.conversations.default) normalized.conversations.default = [];
    return normalized;
  }

  function load() {
    try {
      if (!fs.existsSync(filePath)) {
        state = createDefaultState();
        return state;
      }
      state = normalize(JSON.parse(fs.readFileSync(filePath, 'utf8')));
    } catch (_) {
      state = createDefaultState();
    }
    return state;
  }

  function save() {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
    return true;
  }

  function addMessage({ conversationId = 'default', role, text, timestamp = new Date().toISOString() }) {
    if (typeof conversationId !== 'string' || !conversationId.trim()) throw new Error('Conversation id is required.');
    if (!['user', 'assistant', 'system'].includes(role)) throw new Error('Invalid message role.');
    if (typeof text !== 'string' || !text.trim()) throw new Error('Message text is required.');
    if (typeof timestamp !== 'string' || !timestamp.trim()) throw new Error('Message timestamp is required.');
    const id = conversationId.trim();
    if (!state.conversations[id]) state.conversations[id] = [];
    const message = {
      id: crypto.randomUUID(),
      role,
      text: text.trim().slice(0, 10000),
      timestamp,
    };
    state.conversations[id].push(message);
    state.conversations[id] = state.conversations[id].slice(-maxMessages);
    save();
    return message;
  }

  function getRecentMessages(conversationId = 'default', limit = 50) {
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
    return (state.conversations[conversationId] || []).slice(-safeLimit);
  }

  function setPreference(key, value) {
    if (typeof key !== 'string' || !key.trim()) throw new Error('Preference key is required.');
    state.preferences[key.trim()] = value;
    save();
    return value;
  }

  function getPreferences() {
    return { ...state.preferences };
  }

  function clearAll() {
    state = createDefaultState();
    save();
    return true;
  }

  load();
  return { load, save, addMessage, getRecentMessages, setPreference, getPreferences, clearAll };
}

module.exports = { createMemoryStore };

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAX_ENTRIES = 1000;
const SENSITIVE_KEYS = new Set(['password', 'pass', 'token', 'secret', 'authorization', 'cookie', 'apiKey', 'apikey']);

function sanitize(value, depth = 0) {
  if (depth > 4) return '[truncated]';
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item, depth + 1));
  if (!value || typeof value !== 'object') return typeof value === 'string' ? value.slice(0, 2000) : value;
  return Object.fromEntries(Object.entries(value).slice(0, 40).map(([key, item]) => [
    key,
    SENSITIVE_KEYS.has(key) ? '[redacted]' : sanitize(item, depth + 1),
  ]));
}

function createAuditLog(filePath, options = {}) {
  if (typeof filePath !== 'string' || !filePath.trim()) throw new Error('Audit log path is required.');
  const maxEntries = Number.isInteger(options.maxEntries) ? Math.max(1, Math.min(MAX_ENTRIES, options.maxEntries)) : MAX_ENTRIES;

  function readEntries() {
    try {
      if (!fs.existsSync(filePath)) return [];
      return fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line)).slice(-maxEntries);
    } catch (_) {
      return [];
    }
  }

  function writeEntries(entries) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const temp = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(temp, entries.slice(-maxEntries).map((entry) => JSON.stringify(entry)).join('\n') + (entries.length ? '\n' : ''), 'utf8');
    fs.renameSync(temp, filePath);
  }

  function record(event, details = {}) {
    if (typeof event !== 'string' || !event.trim()) throw new Error('Audit event is required.');
    const entries = readEntries();
    const entry = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), event: event.trim().slice(0, 120), details: sanitize(details) };
    entries.push(entry);
    writeEntries(entries);
    return entry;
  }

  function recent(limit = 50) {
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
    return readEntries().slice(-safeLimit);
  }

  function clear() {
    try { fs.rmSync(filePath, { force: true }); } catch (_) {}
    return true;
  }

  return { record, recent, clear };
}

module.exports = { createAuditLog, sanitize };

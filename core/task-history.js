const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createTaskHistory(filePath, options = {}) {
  if (typeof filePath !== 'string' || !filePath.trim()) throw new Error('Task history file path is required.');
  const maxEntries = Number.isInteger(options.maxEntries) ? Math.max(10, options.maxEntries) : 250;
  let entries = [];

  function load() {
    try {
      if (!fs.existsSync(filePath)) return entries;
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      entries = Array.isArray(parsed) ? parsed.filter(Boolean).slice(-maxEntries) : [];
    } catch (_) {
      entries = [];
    }
    return entries.slice();
  }

  function save() {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const temp = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(entries.slice(-maxEntries), null, 2), 'utf8');
    fs.renameSync(temp, filePath);
  }

  function redact(value) {
    return String(value || '')
      .replace(/(password|passwd|token|secret|api[_-]?key|authorization|cookie)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
      .slice(0, 2000);
  }

  function record({ action, tool = null, status = 'completed', detail = '', metadata = {} } = {}) {
    if (typeof action !== 'string' || !action.trim()) throw new Error('Task action is required.');
    const safeMetadata = {};
    for (const [key, value] of Object.entries(metadata || {}).slice(0, 20)) {
      if (/password|token|secret|key|credential|cookie/i.test(key)) safeMetadata[key] = '[REDACTED]';
      else safeMetadata[key] = redact(typeof value === 'string' ? value : JSON.stringify(value));
    }
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action: redact(action),
      tool: tool ? redact(tool) : null,
      status: redact(status),
      detail: redact(detail),
      metadata: safeMetadata,
    };
    entries.push(entry);
    entries = entries.slice(-maxEntries);
    save();
    return { ...entry, metadata: { ...entry.metadata } };
  }

  function recent(limit = 50) {
    const safe = Math.max(1, Math.min(100, Number(limit) || 50));
    return entries.slice(-safe).map((entry) => ({ ...entry, metadata: { ...(entry.metadata || {}) } }));
  }

  function clear() {
    entries = [];
    save();
    return true;
  }

  load();
  return { load, save, record, recent, clear };
}

module.exports = { createTaskHistory };

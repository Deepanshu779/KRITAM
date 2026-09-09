const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createAuditLog, sanitize } = require('./audit-log');

test('redacts sensitive audit fields', () => {
  const result = sanitize({ token: 'secret', nested: { password: 'hidden' }, ok: 'visible' });
  assert.equal(result.token, '[redacted]');
  assert.equal(result.nested.password, '[redacted]');
  assert.equal(result.ok, 'visible');
});

test('records and reads audit events locally', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kritam-audit-'));
  const log = createAuditLog(path.join(dir, 'audit.jsonl'));
  const entry = log.record('tool.executed', { tool: 'open_app', arguments: { app: 'notepad' } });
  assert.equal(entry.event, 'tool.executed');
  assert.equal(log.recent(1)[0].details.tool, 'open_app');
  log.clear();
  fs.rmSync(dir, { recursive: true, force: true });
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createTaskHistory } = require('./task-history');

test('records and redacts sensitive task details', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kritam-history-'));
  const store = createTaskHistory(path.join(dir, 'tasks.json'), { maxEntries: 10 });
  const entry = store.record({ action: 'Open dashboard', detail: 'token=super-secret-value' });
  assert.match(entry.detail, /token=\[REDACTED\]/);
  assert.equal(store.recent(1).length, 1);
});

test('keeps history bounded', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kritam-history-'));
  const store = createTaskHistory(path.join(dir, 'tasks.json'), { maxEntries: 10 });
  for (let i = 0; i < 15; i += 1) store.record({ action: `Task ${i}` });
  assert.equal(store.recent(100).length, 10);
  assert.equal(store.recent(100)[0].action, 'Task 5');
});

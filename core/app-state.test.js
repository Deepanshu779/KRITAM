const test = require('node:test');
const assert = require('node:assert/strict');
const { parseTasklistCsv, isProcessRunning } = require('./app-state');

test('parses Windows tasklist CSV safely', () => {
  const rows = parseTasklistCsv('"notepad.exe","1234","Console","1","12,345 K"\n"explorer.exe","2222","Console","1","50,000 K"');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].imageName, 'notepad.exe');
  assert.equal(rows[0].pid, '1234');
});

test('detects an allowlisted process', () => {
  const output = '"notepad.exe","1234","Console","1","12,345 K"';
  assert.equal(isProcessRunning(['notepad.exe'], output), true);
  assert.equal(isProcessRunning(['calc.exe'], output), false);
});

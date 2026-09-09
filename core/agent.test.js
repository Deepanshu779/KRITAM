const test = require('node:test');
const assert = require('node:assert/strict');
const { planLocalCommand } = require('./agent');

test('plans approved website commands', () => {
  const request = planLocalCommand('open YouTube');
  assert.equal(request.tool, 'open_url');
  assert.equal(request.arguments.url, 'https://www.youtube.com');
});

test('plans Windows app commands', () => {
  const request = planLocalCommand('launch file explorer');
  assert.equal(request.tool, 'open_app');
  assert.equal(request.arguments.app, 'explorer');
});

test('plans safe folder commands', () => {
  const request = planLocalCommand('open my Downloads');
  assert.equal(request.tool, 'open_path');
  assert.equal(request.arguments.path, 'Downloads');
  assert.equal(planLocalCommand('show Desktop').arguments.path, 'Desktop');
});

test('plans read-only system commands', () => {
  assert.equal(planLocalCommand('show my PC specs').tool, 'system_info');
  assert.equal(planLocalCommand('what time is it').tool, 'get_time');
});

test('understands Hindi and Hinglish open commands', () => {
  assert.equal(planLocalCommand('Chrome kholo')?.tool, 'open_app');
  assert.equal(planLocalCommand('YouTube kholo')?.tool, 'open_url');
  assert.equal(planLocalCommand('mera Downloads folder dikhao')?.tool, 'open_path');
});

test('understands Hindi time and system commands', () => {
  assert.equal(planLocalCommand('time kya hai')?.tool, 'get_time');
  assert.equal(planLocalCommand('system ki info batao')?.tool, 'system_info');
});

test('understands Hindi screen analysis without exposing arbitrary shell access', () => {
  assert.equal(planLocalCommand('screen par kya dikh raha hai')?.tool, 'analyze_screen');
  assert.equal(planLocalCommand('run powershell to delete files'), null);
});

test('ignores unrelated natural language', () => {
  assert.equal(planLocalCommand('tell me a joke'), null);
});

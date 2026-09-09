const test = require('node:test');
const assert = require('node:assert/strict');
const { planLocalCommand } = require('./agent');

test('plans approved website commands', () => {
  const request = planLocalCommand('open YouTube');
  assert.equal(request.tool, 'open_url');
  assert.equal(request.arguments.url, 'https://www.youtube.com');
});

test('plans arbitrary website commands', () => {
  const request = planLocalCommand('open https://example.com/docs');
  assert.equal(request.tool, 'open_url');
  assert.equal(request.arguments.url, 'https://example.com/docs');
});

test('plans Windows app commands', () => {
  const request = planLocalCommand('launch file explorer');
  assert.equal(request.tool, 'open_app');
  assert.equal(request.arguments.app, 'explorer');
});

test('plans arbitrary installed app commands', () => {
  assert.equal(planLocalCommand('open Spotify')?.arguments.app, 'spotify');
  assert.equal(planLocalCommand('launch Visual Studio Code')?.arguments.app, 'visual studio code');
});

test('plans safe folder commands', () => {
  assert.equal(planLocalCommand('open my Downloads').arguments.path, 'Downloads');
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

test('keeps arbitrary shell execution unavailable', () => {
  assert.equal(planLocalCommand('run powershell to delete files'), null);
});

test('ignores unrelated natural language', () => {
  assert.equal(planLocalCommand('tell me a joke'), null);
});

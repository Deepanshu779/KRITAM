const test = require('node:test');
const assert = require('node:assert/strict');
const { splitTask, planStep, planTask } = require('./task-planner');

test('splits a natural multi-step request', () => {
  assert.deepEqual(splitTask('open Notepad and then type hello'), ['open Notepad', 'type hello']);
});

test('plans controlled text input', () => {
  const step = planStep('type Hello KRITAM');
  assert.equal(step.tool, 'type_text');
  assert.equal(step.arguments.text, 'Hello KRITAM');
});

test('creates a bounded multi-step plan', () => {
  const plan = planTask('open Notepad and then type hello');
  assert.equal(plan.type, 'task-plan');
  assert.equal(plan.steps.length, 2);
  assert.equal(plan.steps[0].tool, 'open_app');
  assert.equal(plan.steps[1].tool, 'type_text');
  assert.equal(plan.requiresApproval, true);
});

test('rejects unknown steps instead of guessing', () => {
  assert.equal(planTask('open Notepad and then do something magical'), null);
});

const { planLocalCommand } = require('./agent');

const MAX_STEPS = 8;
const APPROVAL_TOOLS = Object.freeze(['mouse_click', 'type_text', 'capture_screen', 'analyze_screen', 'screen_targets', 'keyboard_shortcut', 'open_app', 'open_path']);

function planStep(text) {
  const value = String(text || '').trim();
  if (!value) return null;
  const typeMatch = value.match(/^(?:then\s+)?(?:type|write|enter|input)\s+(.+)$/i);
  if (typeMatch) return { tool: 'type_text', arguments: { text: typeMatch[1].trim() }, label: 'Type text', description: `Type “${typeMatch[1].trim().slice(0, 80)}${typeMatch[1].trim().length > 80 ? '…' : ''}”.` };
  return planLocalCommand(value);
}
function splitTask(text) { const value = String(text || '').trim(); if (!value) return []; return value.split(/\s+(?:and then|then|after that)\s+|\s*[,;]\s*/i).map((part) => part.trim()).filter(Boolean); }
function planTask(text) {
  const parts = splitTask(text);
  if (parts.length < 2) return null;
  if (parts.length > MAX_STEPS) throw new Error(`KRITAM limits a task to ${MAX_STEPS} controlled steps.`);
  const steps = parts.map(planStep);
  if (steps.some((step) => !step)) return null;
  return { type: 'task-plan', steps: steps.map((step, index) => ({ ...step, index: index + 1 })), requiresApproval: steps.some((step) => APPROVAL_TOOLS.includes(step.tool)), maxSteps: MAX_STEPS };
}
module.exports = { MAX_STEPS, APPROVAL_TOOLS, splitTask, planStep, planTask };

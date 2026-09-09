const { normalizeTarget, selectTarget, buildTargetPrompt } = require('./screen-targets');

const MIN_TEXT_CONFIDENCE = 0.82;
const MAX_TEXT_LENGTH = 2000;

function validateText(text) {
  const value = String(text ?? '');
  if (!value.trim()) throw new Error('Text to type is required.');
  if (value.length > MAX_TEXT_LENGTH) throw new Error('Text is too long for a single verified typing action.');
  if (/\0/.test(value)) throw new Error('Invalid text input.');
  return value;
}

function buildFieldPrompt(instruction, text) {
  return `${buildTargetPrompt(instruction)} The target must be a visible text-entry field that can safely receive the requested text. Requested text: "${validateText(text).slice(0, 500)}". Prefer an empty or clearly editable field. Never return a button, menu item, password field, or non-editable label as a typing target.`;
}

function validateTypingTarget(target) {
  const normalized = normalizeTarget(target);
  if (normalized.confidence == null || normalized.confidence < MIN_TEXT_CONFIDENCE) throw new Error('KRITAM will not type into a low-confidence text field.');
  if (normalized.actionable === false) throw new Error('The selected text field is not actionable.');
  return normalized;
}

function chooseTypingTarget(targets, instruction) {
  const result = selectTarget(targets, instruction, { minConfidence: MIN_TEXT_CONFIDENCE, ambiguityMargin: 0.14 });
  if (result.status === 'selected') return { ...result, target: validateTypingTarget(result.target) };
  return result;
}

function buildTypingAction(instruction, text, target) {
  return {
    type: 'verified-typing',
    instruction: String(instruction || '').trim().slice(0, 1000),
    text: validateText(text),
    target: validateTypingTarget(target),
    requiresApproval: true,
    verification: 'semantic_post_action_screen',
  };
}

module.exports = { MIN_TEXT_CONFIDENCE, MAX_TEXT_LENGTH, validateText, buildFieldPrompt, validateTypingTarget, chooseTypingTarget, buildTypingAction };

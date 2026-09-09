const TARGET_SCHEMA_VERSION = 1;
const MAX_TARGETS = 32;
const MIN_ACTIONABLE_CONFIDENCE = 0.75;
const AMBIGUITY_MARGIN = 0.12;

function clamp01(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : null;
}

function normalizeTarget(target, index = 0) {
  if (!target || typeof target !== 'object') throw new Error('A screen target must be an object.');
  const label = String(target.label || target.text || '').trim().slice(0, 160);
  const x = Number(target.x);
  const y = Number(target.y);
  if (!label) throw new Error('A screen target needs a label.');
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('A screen target needs numeric coordinates.');
  return {
    id: String(target.id || `target-${index + 1}`),
    label,
    x: Math.round(x),
    y: Math.round(y),
    confidence: clamp01(target.confidence),
    actionable: target.actionable !== false,
  };
}

function parseVisionTargets(payload) {
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch (_) { return []; }
  }
  const targets = Array.isArray(payload) ? payload : payload?.targets;
  if (!Array.isArray(targets)) return [];
  return targets.slice(0, MAX_TARGETS).map(normalizeTarget);
}

function instructionTokens(instruction) {
  return String(instruction || '').toLowerCase().match(/[a-z0-9]+/g) || [];
}

function rankTarget(target, instruction) {
  const confidence = clamp01(target.confidence) ?? 0;
  const labelTokens = new Set(String(target.label || '').toLowerCase().match(/[a-z0-9]+/g) || []);
  const tokens = instructionTokens(instruction).filter((token) => !['click', 'press', 'select', 'tap', 'the', 'button', 'on', 'at', 'my'].includes(token));
  const matches = tokens.filter((token) => labelTokens.has(token)).length;
  const phrase = tokens.length ? matches / tokens.length : 0;
  return Math.min(1, confidence * 0.75 + phrase * 0.25);
}

function selectTarget(targets, instruction, options = {}) {
  const minConfidence = Number.isFinite(Number(options.minConfidence)) ? Number(options.minConfidence) : MIN_ACTIONABLE_CONFIDENCE;
  const ambiguityMargin = Number.isFinite(Number(options.ambiguityMargin)) ? Number(options.ambiguityMargin) : AMBIGUITY_MARGIN;
  const candidates = (Array.isArray(targets) ? targets : [])
    .filter((target) => target?.actionable !== false && Number(target?.confidence) >= minConfidence)
    .map((target) => ({ ...target, selectionScore: rankTarget(target, instruction) }))
    .sort((a, b) => b.selectionScore - a.selectionScore);

  if (!candidates.length) return { status: 'none', candidates: [] };
  if (candidates.length === 1) return { status: 'selected', target: candidates[0], candidates };

  const [best, second] = candidates;
  if (best.selectionScore - second.selectionScore < ambiguityMargin) {
    return { status: 'ambiguous', candidates: candidates.slice(0, 5) };
  }
  return { status: 'selected', target: best, candidates: candidates.slice(0, 5) };
}

function buildTargetPrompt(instruction) {
  const task = String(instruction || '').trim().slice(0, 1000);
  return `Analyze this screenshot for the requested task: "${task}". Return ONLY valid JSON with this shape: {"targets":[{"id":"target-1","label":"short UI label","x":123,"y":456,"confidence":0.0,"actionable":true}]}. Coordinates must be pixel coordinates relative to the supplied image. Include only visible, actionable UI targets relevant to the task. Do not guess hidden elements.`;
}

module.exports = { TARGET_SCHEMA_VERSION, MAX_TARGETS, MIN_ACTIONABLE_CONFIDENCE, AMBIGUITY_MARGIN, clamp01, normalizeTarget, parseVisionTargets, rankTarget, selectTarget, buildTargetPrompt };

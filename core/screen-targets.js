const TARGET_SCHEMA_VERSION = 1;
const MAX_TARGETS = 32;

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

function buildTargetPrompt(instruction) {
  const task = String(instruction || '').trim().slice(0, 1000);
  return `Analyze this screenshot for the requested task: "${task}". Return ONLY valid JSON with this shape: {"targets":[{"id":"target-1","label":"short UI label","x":123,"y":456,"confidence":0.0,"actionable":true}]}. Coordinates must be pixel coordinates relative to the supplied image. Include only visible, actionable UI targets relevant to the task. Do not guess hidden elements.`;
}

module.exports = { TARGET_SCHEMA_VERSION, MAX_TARGETS, clamp01, normalizeTarget, parseVisionTargets, buildTargetPrompt };

const { applyScreenVerification } = require('./action-verifier');

const DEFAULT_MIN_CONFIDENCE = 0.72;

function normalizeObservation(observation = {}) {
  return {
    changed: observation.changed === true,
    confidence: Number.isFinite(Number(observation.confidence)) ? Number(observation.confidence) : 0,
    note: String(observation.note || ''),
  };
}

function verifyScreenAction(record, observation, minConfidence = DEFAULT_MIN_CONFIDENCE) {
  const normalized = normalizeObservation(observation);
  const threshold = Math.max(0, Math.min(1, Number(minConfidence)));
  const confident = normalized.confidence >= threshold;
  return applyScreenVerification(record, {
    changed: normalized.changed && confident,
    confidence: normalized.confidence,
    note: confident ? normalized.note : 'Verification confidence was below the required threshold.',
  });
}

module.exports = { DEFAULT_MIN_CONFIDENCE, normalizeObservation, verifyScreenAction };

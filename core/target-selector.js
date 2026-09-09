const DEFAULT_CONFIDENCE = 0.75;
const MAX_CANDIDATES = 5;

function rankTargets(targets, query) {
  const value = String(query || '').trim().toLowerCase();
  if (!Array.isArray(targets)) return [];
  return targets
    .filter((target) => target && target.actionable !== false)
    .map((target) => {
      const label = String(target.label || '').toLowerCase();
      const confidence = Number(target.confidence);
      const textMatch = value && label.includes(value) ? 1 : 0;
      return { ...target, score: (Number.isFinite(confidence) ? confidence : 0) + textMatch };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES);
}

function selectTarget(targets, query, minConfidence = DEFAULT_CONFIDENCE) {
  const ranked = rankTargets(targets, query);
  if (!ranked.length) return { status: 'not_found', candidates: [] };
  const threshold = Math.max(0, Math.min(1, Number(minConfidence)));
  const exact = ranked.find((target) => String(target.label).toLowerCase() === String(query || '').trim().toLowerCase());
  const best = exact || ranked[0];
  if (!Number.isFinite(Number(best.confidence)) || Number(best.confidence) < threshold) {
    return { status: 'clarify', candidates: ranked };
  }
  const second = ranked[1];
  if (second && Math.abs(Number(best.score) - Number(second.score)) < 0.08) {
    return { status: 'clarify', candidates: ranked };
  }
  return { status: 'selected', target: best, candidates: ranked };
}

module.exports = { DEFAULT_CONFIDENCE, MAX_CANDIDATES, rankTargets, selectTarget };

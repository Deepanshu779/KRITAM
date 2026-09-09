const DEFAULT_MIN_CONFIDENCE = 0.78;

function parseVerificationResponse(payload) {
  if (typeof payload === 'object' && payload !== null) return payload;
  const text = String(payload || '').trim();
  if (!text) return { success: false, confidence: 0, reason: 'No vision verification response.' };
  try {
    const fenced = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(fenced);
  } catch (_) {
    return { success: false, confidence: 0, reason: 'Vision verification did not return valid JSON.' };
  }
}

function normalizeVerification(payload, minConfidence = DEFAULT_MIN_CONFIDENCE) {
  const parsed = parseVerificationResponse(payload);
  const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
  const threshold = Math.max(0, Math.min(1, Number(minConfidence)));
  const success = parsed.success === true && confidence >= threshold;
  return {
    success,
    confidence,
    reason: String(parsed.reason || (success ? 'The requested UI change is visible.' : 'The requested UI change could not be confirmed.')).slice(0, 500),
    evidence: String(parsed.evidence || '').slice(0, 500),
  };
}

function buildVerificationPrompt(instruction, targetLabel) {
  const task = String(instruction || '').trim().slice(0, 1000);
  const target = String(targetLabel || '').trim().slice(0, 160);
  return `Compare this current screenshot with the requested desktop action. The intended action was: "${task}". The clicked target was: "${target}". Return ONLY valid JSON: {"success":true,"confidence":0.0,"reason":"short explanation","evidence":"visible UI evidence"}. Set success=true only when the screenshot provides visible evidence that the requested action actually succeeded. Do not infer success from the fact that the screen changed. If uncertain, use success=false. Do not invent UI state.`;
}

module.exports = { DEFAULT_MIN_CONFIDENCE, parseVerificationResponse, normalizeVerification, buildVerificationPrompt };
